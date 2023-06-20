/** @param {NS} ns */
//run scripts/dispatch.js scripts/early-hack.js currentMachine
export async function main(ns) {

    // use datastructure from scan to do the whole network
    const hackingScript = ns.args[0];
    const currentMachine = ns.args[1];
    const ramUsageOfHackingScript = ns.getScriptRam(hackingScript);
  
    ns.tprint("RamOfHackingScript: ", ramUsageOfHackingScript)
  
    const localMachineScan = ns
      .scan()
      .concat([currentMachine])
      .map(x => (
        {
          server: x,
          moneyThreshhold: ns.getServerMaxMoney(x) * 0.75,
          securityThreshhold: ns.getServerMinSecurityLevel(x) + 5,
          threadsNeeded: Math.floor(ns.getServerMaxRam(x) / ramUsageOfHackingScript),
          skillRequired: ns.getServerRequiredHackingLevel(x)
        }))
      .filter(x => x.skillRequired <= ns.getHackingLevel()); //new
  
    const target = localMachineScan
      .sort((a, b) => a.moneyThreshhold - b.moneyThreshhold)
      .pop();
  
    ns.tprint("Target: ", target);
  
    localMachineScan.push(target);
  
    localMachineScan
      .map(x => {
        if (x.server !== currentMachine) {
          if (ns.fileExists("BruteSSH.exe", "home")) {
            ns.brutessh(x.server);
          }
  
          if (ns.fileExists("FTPCrack.exe", "home")) {
            ns.ftpcrack(x.server);
          }
  
          ns.nuke(x.server);
          ns.killall(x.server);
  
          if (x.server !== "home") {
            ns
              .ls(x.server, '.js')
              .map(y => ns.rm(y, x.server))
          }
  
          ns.scp(hackingScript, x.server);
          ns.exec(hackingScript, x.server, x.threadsNeeded, target.server, target.moneyThreshhold, target.securityThreshhold);
        }
        else {
          ns.tprint("run ", hackingScript, " -t ", x.threadsNeeded, " ", target.server, " ", target.moneyThreshhold, " ", target.securityThreshhold);
        }
      })
  }

  