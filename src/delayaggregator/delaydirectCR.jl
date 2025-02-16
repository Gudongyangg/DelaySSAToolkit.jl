const MINJUMPRATE = 2.0^exponent(1e-12)

mutable struct DelayDirectCRJumpAggregation{T,S,F1,F2,RNG,DEPGR,U<:DiffEqJump.PriorityTable,W<:Function} <: AbstractDSSAJumpAggregator
    next_jump::Int
    prev_jump::Int
    next_jump_time::T
    end_time::T
    cur_rates::Vector{T}
    sum_rate::T
    ma_jumps::S
    rates::F1
    affects!::F2
    save_positions::Tuple{Bool,Bool}
    rng::RNG
    dep_gr::DEPGR
    minrate::T
    maxrate::T   # initial maxrate only, table can increase beyond it!
    rt::U
    ratetogroup::W
    next_delay::Union{Nothing,Vector{Int}}
    num_next_delay::Union{Nothing,Vector{Int}}
    time_to_next_jump::T
    dt_delay::T
end

function DelayDirectCRJumpAggregation(nj::Int, njt::T, et::T, crs::Vector{T}, sr::T,
                                      maj::S, rs::F1, affs!::F2, sps::Tuple{Bool,Bool},
                                      rng::RNG; num_specs, dep_graph=nothing,
                                      minrate=convert(T,MINJUMPRATE), maxrate=convert(T,Inf),
                                      kwargs...) where {T,S,F1,F2,RNG}

    # a dependency graph is needed and must be provided if there are constant rate jumps
    if dep_graph === nothing
        if (get_num_majumps(maj) == 0) || !isempty(rs)
            error("To use ConstantRateJumps with the DirectCR algorithm a dependency graph must be supplied.")
        else
            dg = make_dependency_graph(num_specs, maj)
        end
    else
        dg = dep_graph

        # make sure each jump depends on itself
        add_self_dependencies!(dg)
    end

    # mapping from jump rate to group id
    minexponent = exponent(minrate)

    # use the largest power of two that is <= the passed in minrate
    minrate = 2.0^minexponent
    ratetogroup = rate -> DiffEqJump.priortogid(rate, minexponent)

    # construct an empty initial priority table -- we'll reset this in init
    rt = DiffEqJump.PriorityTable(ratetogroup, zeros(T, 1), minrate, 2*minrate)
    nd = nothing
    nnd = nothing
    ttnj = zero(et)
    dt_delay = zero(et)
    DelayDirectCRJumpAggregation{T,S,F1,F2,RNG,typeof(dg),typeof(rt),typeof(ratetogroup)}(
                                            nj, nj, njt, et, crs, sr, maj, rs, affs!, sps, rng,
                                            dg, minrate, maxrate, rt, ratetogroup, nd, nnd, ttnj, dt_delay)
end


############################# Required Functions ##############################

# creating the JumpAggregation structure (function wrapper-based constant jumps)
function aggregate(aggregator::DelayDirectCR, u, p, t, end_time, constant_jumps,
                   ma_jumps, save_positions, rng; kwargs...)

    # handle constant jumps using function wrappers
    rates, affects! = get_jump_info_fwrappers(u, p, t, constant_jumps)

    build_jump_aggregation(DelayDirectCRJumpAggregation, u, p, t, end_time, ma_jumps,
                           rates, affects!, save_positions, rng; num_specs=length(u), kwargs...)
end


# set up a new simulation and calculate the first jump / jump time
function initialize!(p::DelayDirectCRJumpAggregation, integrator, u, params, t)

    # initialize rates
    fill_rates_and_sum!(p, u, params, t)

    # setup PriorityTable
    DiffEqJump.reset!(p.rt)
    for (pid,priority) in enumerate(p.cur_rates)
        DiffEqJump.insert!(p.rt, pid, priority)
    end
    find_next_delay_dt!(p, integrator)
    generate_jumps!(p, integrator, u, params, t)
    nothing
end

# execute one jump, changing the system state
function execute_jumps!(p::DelayDirectCRJumpAggregation, integrator, u, params, t)
    # execute jump
    update_state_delay!(p, integrator, u, t)

    # update current jump rates
    update_dependent_rates_delay!(p, integrator, u, params, t)
    nothing
end

# calculate the next jump / jump time
function generate_jumps!(p::DelayDirectCRJumpAggregation, integrator, u, params, t)
    dt_reaction  = randexp(p.rng) / p.sum_rate
    dt_delay_generation!(p, integrator)
    compare_delay!(p, integrator.de_chan, p.dt_delay, dt_reaction, t)
    if p.next_jump_time < p.end_time
        if p.next_delay != nothing
            p.next_jump = 0
        else
            p.next_jump = DiffEqJump.sample(p.rt, p.cur_rates, p.rng)
        end
    end    
    nothing
end




######################## SSA specific helper routines #########################

# recalculate jump rates for jumps that depend on the just executed jump
# requires dependency graph
function update_dependent_rates_delay!(p::DelayDirectCRJumpAggregation, integrator, u, params, t)
    
    if p.next_delay == nothing  # if next reaction is not delay reaction 
        @inbounds dep_rxs = p.dep_gr[p.next_jump]
    else
        # find the dep_rxs w.r.t next_delay vectors
        vars_ = Vector{Vector{Int}}(undef,length(p.next_delay))
        var_to_jumps = var_to_jumps_map(length(u),p.ma_jumps)
        @inbounds for i in eachindex(p.next_delay)
            vars_[i] = first.(integrator.delayjumpsets.delay_complete[p.next_delay[i]])
        end
        vars = reduce(vcat, vars_)
        dep_rxs_ = Vector{Vector{Int}}(undef,length(vars))
        @inbounds for i in eachindex(dep_rxs_)
            dep_rxs_[i] = var_to_jumps[vars[i]]
        end
        dep_rxs = reduce(vcat, dep_rxs_)
    end

    @unpack cur_rates, rates, ma_jumps, rt = p
    num_majumps = get_num_majumps(ma_jumps)

    @inbounds for rx in dep_rxs
        oldrate = cur_rates[rx]

        # update rate
        cur_rates[rx] = calculate_jump_rate(ma_jumps, num_majumps, rates, u, params, t, rx)

        # update table
        DiffEqJump.update!(rt, rx, oldrate, cur_rates[rx])
    end

    p.sum_rate = DiffEqJump.groupsum(rt)
    nothing
end