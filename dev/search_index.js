var documenterSearchIndex = {"docs":
[{"location":"tutorials/delay_degradation/#A-delay-production-example","page":"A delay production example","title":"A delay production example","text":"","category":"section"},{"location":"tutorials/delay_degradation/#Model-definition","page":"A delay production example","title":"Model definition","text":"","category":"section"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"The model is defined as follows: 1. Cemptyset rightarrow X_A; 2. gamma  X_A rightarrow emptyset; 3. beta  X_A rightarrow  X_I, which triggers X_Irightarrow emptyset after tau time; 4. gamma X_I rightarrow emptyset, which causes the delay channel to change its state during a schduled delay reaction.","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"This example is studied by [1], where one can solve the exact solution analytically. If we denote X_A(t) to be the mean value of X_A at time t, and X_I(t) the mean value of X_I at time t, then","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"X_A(t)= fracCa( 1-e^-at )quad X_I(t) = begincases\nfracCβa-γbigfrac1-e^-γtγ-frac1-e^-atabig t in 0tau\nfracCβaBigfrac1-e^-γτγ+frac(1-e^τ(a-γ))a-γe^-atBig  t in (tauinfty)\nendcases","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"where a = β + γ.","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"We first define the parameters and the mass-action jump (see Defining a Mass Action Jump for details)","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"C, γ, β, τ = [2., 0.1, 0.5, 15.]\nrate1 = [C,γ,β,γ]\nreactant_stoich = [[],[1=>1],[1=>1],[2=>1]]\nnet_stoich = [[1=>1],[1=>-1],[1=>-1,2=>1],[2=>-1]]\nmass_jump = MassActionJump(rate1, reactant_stoich, net_stoich; scale_rates =false)\njumpset = JumpSet((),(),nothing,[mass_jump])","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"rates  A vector of rates of reactions.\nreactant_stoch is a vector whose kth entry is the reactant stoichiometry of the kth reaction. The reactant stoichiometry for an individual reaction is assumed to be represented as a vector of Pairs, mapping species id to stoichiometric coefficient.\nnet_stoch  is assumed to have the same type as reactant_stoich; a vector whose kth entry is the net stoichiometry of the kth reaction. The net stoichiometry for an individual reaction is again represented as a vector of Pairs, mapping species id to the net change in the species when the reaction occurs.\nscale_rates is an optional parameter that specifies whether the rate constants correspond to stochastic rate constants in the sense used by Gillespie, and hence need to be rescaled. The default, scale_rates=true, corresponds to rescaling the passed in rate constants. When using MassActionJump the default behavior is to assume rate constants correspond to stochastic rate constants in the sense used by Gillespie (J. Comp. Phys., 1976, 22 (4)). This means that for a reaction such as 2A oversetkrightarrow B, the jump rate function constructed by MassActionJump would be k*A*(A-1)/2!. For a trimolecular reaction like 3A oversetkrightarrow B the rate function would be k*A*(A-1)*(A-2)/3!. To avoid having the reaction rates rescaled (by 1/2 and 1/6 for these two examples), one can pass the MassActionJump constructor the optional named parameter scale_rates=false\nmass_jump  Define mass-action jumps\njumpsets  Wrap up the reactions into one jumpset.","category":"page"},{"location":"tutorials/delay_degradation/#Defining-a-DelayJumpSet","page":"A delay production example","title":"Defining a DelayJumpSet","text":"","category":"section"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"Then we turn to the definition of delay reactions","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"delay_trigger_affect! = function (de_chan, rng)\n   append!(de_chan[1], τ)\nend\ndelay_trigger = Dict(3=>delay_trigger_affect!)\ndelay_complete = Dict(1=>[2=>-1]) \n\ndelay_affect! = function (de_chan, rng)\n    i = rand(rng, 1:length(de_chan[1]))\n    deleteat!(de_chan[1],i)\nend\ndelay_interrupt = Dict(4=>delay_affect!) \ndelaysets = DelayJumpSet(delay_trigger,delay_complete,delay_interrupt)","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"delay_trigger  \nKeys: Indices of reactions defined in jumpset that can trigger the delay reaction. Here we have the 3rd reaction beta X_A rightarrow X_I that will trigger the X_I to degrade after time tau.\nValues: A update function that determines how to update the delay channel. In this example, once the delay reaction is trigged, the delay channel 1 (which is the channel for X_I) will be added a delay time tau.\t\t\t\ndelay_interrupt\nKeys: Indices of reactions defined in jumpset that can cause the change in delay channel. In this example, the 4th reaction gamma  X_I rightarrow emptyset will change the schduled delay reaction to change its state immediately.\nValues: A update function that determines how to update the delay channel. In this example, once a delay-interrupt reaction happens, any of the reactants X_I that is supposed to leave the system after time tau can be degraded immediately.  \ndelay_complete \nKeys: Indices of delay channel. Here the 1st delay channel corresponds to X_I.\nValues: A vector of Pairs, mapping species id to net change of stoichiometric coefficient.","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"Now we can initialise the problem by setting ","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"u0 = [0, 0]\ntf = 30.\nsaveat = .1\nde_chan0 = [[]]\np = 0.\ntspan = (0.,tf)","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"where de_chan0 is the initial condition for the delay channel, which is a vector of arrays whose kth entry stores the schduled delay time for kth delay channel. Here we assume X_I(0) = 0, thus only an empty array. Next, we choose a delay SSA algorithm DelayDirect() and define the problem","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"aggregatoralgo = DelayDirect()\nsave_positions = (false,false)\ndprob = DiscreteProblem(u0, tspan, p)\njprob = JumpProblem(dprob, aggregatoralgo, jumpset, save_positions = (false,false))\ndjprob = DelayJumpProblem(jprob,delaysets,de_chan0)","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"where DelayJumpProblem inputs JumpProblem, DelayJumpSet and the initial condition of the delay channel de_chan0.","category":"page"},{"location":"tutorials/delay_degradation/#Visualisation","page":"A delay production example","title":"Visualisation","text":"","category":"section"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"Now we can solve the problem and plot a trajectory","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"using Plots, DiffEqBase\nsol = solve(djprob, SSAStepper(), seed=2, saveat =.1, save_delay_channel = false)","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"Then we simulate 10^4 trajectories and calculate the evolution of mean value for each reactant","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"using StatsBase\nSample_size = Int(1e4)\nens_prob = EnsembleProblem(djprob)\nens =@time solve(ens_prob,SSAStepper(),EnsembleThreads(),trajectories = Sample_size, saveat = .1, save_delay_channel =false)","category":"page"},{"location":"tutorials/delay_degradation/#Verification-with-the-exact-solution","page":"A delay production example","title":"Verification with the exact solution","text":"","category":"section"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"Lastkt, we can compare with the mean values of the exact solutions X_I X_A","category":"page"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"timestamps = 0:0.1:tf\na = β + γ \nmean_x_A(t) = C/a*(1-exp(-a*t))\nmean_x_I(t)= 0<=t<=τ ? C*β/(a-γ)*((1-exp(-γ*t))/γ - (1-exp(-a*t))/a) : C*β/a*((1-exp(-γ*τ))/γ + exp(-a*t)*(1-exp((a-γ)τ))/(a-γ))","category":"page"},{"location":"tutorials/delay_degradation/#Reference","page":"A delay production example","title":"Reference","text":"","category":"section"},{"location":"tutorials/delay_degradation/","page":"A delay production example","title":"A delay production example","text":"[1] Lafuerza, L. F., & Toral, R. (2011). Exact solution of a stochastic protein dynamics model with delayed degradation. Physical Review E, 84(5), 051121.","category":"page"},{"location":"api/#Main-API","page":"API","title":"Main API","text":"","category":"section"},{"location":"api/","page":"API","title":"API","text":"","category":"page"},{"location":"algorithms/delaymnrm/#Delay-Modified-Next-Reaction-Method-Algorithm","page":"Delay Modified Next Reaction Method Algorithm","title":"Delay Modified Next Reaction Method Algorithm","text":"","category":"section"},{"location":"theory/#Theory","page":"Theory","title":"Theory","text":"","category":"section"},{"location":"theory/#Delay-Direct-Method","page":"Theory","title":"Delay Direct Method","text":"","category":"section"},{"location":"algorithms/delaydirect/#Delay-Direct-Method-Algorithm","page":"Delay Direct Method Algorithm","title":"Delay Direct Method Algorithm","text":"","category":"section"},{"location":"algorithms/delaydirect/","page":"Delay Direct Method Algorithm","title":"Delay Direct Method Algorithm","text":"Suppose that at time t there are ongoing delayed reactions set to complete at times t+T_1 t+T_2 ldots t+T_d. Define T_0=0 and T_d+1=infty.","category":"page"},{"location":"algorithms/delaydirect/","page":"Delay Direct Method Algorithm","title":"Delay Direct Method Algorithm","text":"Define Tstruct, whose i-th (i=1dotsd) row stores T_i and the index, mu_i, of the reaction that T_i is associated with.","category":"page"},{"location":"algorithms/delaydirect/","page":"Delay Direct Method Algorithm","title":"Delay Direct Method Algorithm","text":"Initialize. Set the initial number of molecules of each species and set  t=0. Clear Tstruct.\nCalculate the propensity of function a_k, for each reaction k in 1ldots M.\nSet a_0=sum_k=1^Ma_k.\nGenerate  Delta.\nInput the time t and a_0=sum_k=1^Ma_k.\nGenerate an independent uniform (01) random number r_1.\nIf Tstruct is empty \nthis means there is no ongoing delayed reactions, set Delta = 1a_0ln(1r_1).\nElse\nset i=1, a_t = a_0T_1 and  F=1-e^-a_t.\nWhile F  r_1\nUpdate the state vector x_1 due to the finish of the delayed reaction t+T_i.\nIf id\nCalculate propensity a_k(t+T_i+1) due to the finish of the delayed reaction at t+T_i+1 and calculate a_0(t+T_i+1).\nUpdate a_t=a_t+a_0(t+T_i+1)(T_i+1-T_i).\nUpdate F=1-e^-a_t  i=i+1.\nElse\nSet F=1\nEndIf\nEndWhile\nCalculate Calculate propensity a_k(t+T_i) due to the finish of the delayed reaction at t+T_i and calculate a_0(t+T_i).\nSet Delta=T_i-(ln(1-r_1)+a_t-a_0(t+T_i)(T_i+1-T_i))a_0(t+T_i).\nEndIf\nIf DeltainT_iT_i+1), delete the columns 1ldotsi of T_i and set T_j=T_j-Delta.\nGenerate an independent uniform (01) random number r_2.\nFind muin1dotsm such that $ \\sum{k=1}^{\\mu-1} ak < r2 \\leq \\sum{k=1}^{\\mu}ak $ where the ak$ and a_0 are generated in step 4.\nIf muin textND , update the number of each molecular species according to the reaction mu\nIf muin textCD, update Tstruct by adding the row tau_mumu so that Tstruct(i1)Tstruct(i+11) still holds for all i.\nIf muin textICD, update the system according to the initiation of mu and update Tstruct by adding the row tau_mumu so that Tstruct(i1)Tstruct(i+11) still holds for all i.\nSet t=t+Delta.\nReturn to Step 2 or quit.","category":"page"},{"location":"algorithms/delaydirect/","page":"Delay Direct Method Algorithm","title":"Delay Direct Method Algorithm","text":"Remark. Notice that in the above pseudo-code, we modified the Step 4. in the orignal algorithm but both are equivalent.","category":"page"},{"location":"algorithms/delaydirect/#Reference","page":"Delay Direct Method Algorithm","title":"Reference","text":"","category":"section"},{"location":"algorithms/delaydirect/","page":"Delay Direct Method Algorithm","title":"Delay Direct Method Algorithm","text":"C. Xiaodong, “Exact stochastic simulation of coupled chemical reactions with delays,” Journal of Chemical Physics, vol. 126, no. 12, p. 297, 2007, doi: 10.1063/1.2710253.","category":"page"},{"location":"algorithms/delayrejection/#Delay-Rejection-Method-Algorithm","page":"Delay Rejection Method Algorithm","title":"Delay Rejection Method Algorithm","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"CurrentModule = DelaySSAToolkit","category":"page"},{"location":"#DelaySSAToolkit","page":"Home","title":"DelaySSAToolkit","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Documentation for DelaySSAToolkit.","category":"page"},{"location":"","page":"Home","title":"Home","text":"Modules = [DelaySSAToolkit]","category":"page"}]
}
