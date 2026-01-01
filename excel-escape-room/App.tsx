{/* 6. BILLBOARD VIEW (UPDATED PODIUM DESIGN) */}
      {view === 'billboard' && (
        <div className="max-w-6xl mx-auto min-h-screen pb-20">
          <div className="flex justify-between items-center mb-12 pt-10">
            <div>
              <h1 className="text-6xl font-black italic tracking-tighter text-cyan-400 uppercase drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">Leaderboard</h1>
              <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.4em] mt-2">Mission Control Feed</p>
            </div>
            <button onClick={() => setView('login')} className="bg-slate-900 px-8 py-3 rounded-xl text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.3em] border border-slate-800">
              Back to App
            </button>
          </div>

          {/* TOP 3 PODIUM */}
          {leaderboard.length > 0 && (
            <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-16 min-h-[350px]">
              
              {/* RANK 2 (Left) */}
              {leaderboard[1] && (
                <div className="order-2 md:order-1 relative bg-[#0f172a] border border-slate-800 w-full md:w-64 h-64 rounded-[30px] flex flex-col items-center justify-center p-6 shadow-2xl">
                  <div className="text-4xl font-black text-slate-700 mb-2">02</div>
                  <Icons.Trophy className="w-12 h-12 text-slate-600 mb-4" />
                  <h3 className="text-xl font-black text-white uppercase tracking-tight text-center">{leaderboard[1].name}</h3>
                  <p className="text-cyan-500 font-mono font-bold mt-2">{leaderboard[1].totalPoints} PTS</p>
                  <div className="flex gap-1 mt-3">
                     {[...Array(3)].map((_,i) => <div key={i} className="h-1 w-6 bg-slate-800 rounded-full"></div>)}
                  </div>
                </div>
              )}

              {/* RANK 1 (Center - Big) */}
              {leaderboard[0] && (
                <div className="order-1 md:order-2 relative bg-gradient-to-b from-[#0f172a] to-[#020617] border-2 border-cyan-500 w-full md:w-80 h-80 rounded-[40px] flex flex-col items-center justify-center p-8 shadow-[0_0_50px_rgba(6,182,212,0.2)] z-10 -translate-y-4">
                  <div className="absolute -top-6 bg-cyan-500 text-black font-black px-6 py-2 rounded-full shadow-lg">1st PLACE</div>
                  <div className="text-5xl font-black text-cyan-500/20 mb-2">01</div>
                  <Icons.Trophy className="w-16 h-16 text-yellow-400 mb-4 drop-shadow-lg" />
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight text-center leading-none mb-2">{leaderboard[0].name}</h3>
                  <p className="text-cyan-400 font-mono text-xl font-bold">{leaderboard[0].totalPoints} PTS</p>
                  <div className="flex gap-1 mt-4">
                     {[...Array(5)].map((_,i) => <div key={i} className="h-1.5 w-8 bg-cyan-500 rounded-full shadow-[0_0_8px_cyan]"></div>)}
                  </div>
                </div>
              )}

              {/* RANK 3 (Right) */}
              {leaderboard[2] && (
                <div className="order-3 relative bg-[#0f172a] border border-slate-800 w-full md:w-64 h-56 rounded-[30px] flex flex-col items-center justify-center p-6 shadow-2xl opacity-80">
                  <div className="text-4xl font-black text-slate-700 mb-2">03</div>
                  <Icons.Trophy className="w-10 h-10 text-amber-700 mb-4" />
                  <h3 className="text-lg font-black text-white uppercase tracking-tight text-center">{leaderboard[2].name}</h3>
                  <p className="text-cyan-600 font-mono font-bold mt-2">{leaderboard[2].totalPoints} PTS</p>
                  <div className="flex gap-1 mt-3">
                     {[...Array(2)].map((_,i) => <div key={i} className="h-1 w-6 bg-slate-800 rounded-full"></div>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LIST FOR RANK 4+ */}
          <div className="space-y-3 max-w-4xl mx-auto">
            {leaderboard.slice(3).map((team, idx) => (
              <div key={team.name} className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 flex items-center justify-between hover:bg-slate-800 transition-colors">
                 <div className="flex items-center gap-8">
                    <span className="text-sm font-black text-slate-600 w-8">#{idx + 4}</span>
                    <h4 className="text-lg font-black text-slate-300 uppercase tracking-tight">{team.name}</h4>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="hidden md:flex gap-1">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className={`h-1.5 w-4 rounded-full ${j < team.missionsDone ? 'bg-cyan-900' : 'bg-slate-900'}`}></div>
                      ))}
                    </div>
                    <span className="text-cyan-500 font-mono font-bold">{team.totalPoints} pts</span>
                 </div>
              </div>
            ))}
            
            {leaderboard.length === 0 && (
               <div className="text-center py-20">
                  <p className="text-slate-600 font-mono uppercase tracking-widest animate-pulse">Establishing Link to Database...</p>
               </div>
            )}
          </div>
        </div>
      )}
