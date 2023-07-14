/** @param {NS} ns */
export async function main(ns) {

  const notImportantScriptsForEarlyGame = [
    "scripts/singularity/finish-bitnode.js", 
    "scripts/singularity/finish-round.js", 
    "scripts/singularity/buy-rep.js",
    "scripts/hacking/batch-dispatch.js",
    "scripts/tools/manually-end-round.js",
  ];

  const notImportantFolder = "scripts/corporation/"

  const orderedScriptsByRamUsage = ns
    .ls("home")
    .filter(x => x.endsWith(".js"))
    .map(x => new ScriptRam(ns.getScriptRam(x), x))
    .sort((a, b) => b.ram - a.ram);

  const mostExpensiveScript = orderedScriptsByRamUsage[0];
  const coordinator = orderedScriptsByRamUsage.find(x => x.name === "scripts/coordinator.js")
  const contractCoordinator = orderedScriptsByRamUsage.find(x => x.name === "scripts/contracts/contract-coordinator.js")
  const stockCoordinator = orderedScriptsByRamUsage.find(x => x.name === "scripts/stock/stock-coordinator.js")
  const ramToReserve = coordinator.ram + mostExpensiveScript.ram + contractCoordinator.ram + stockCoordinator.ram;

  const earlyGameScriptsUsage = orderedScriptsByRamUsage
    .filter(x => !notImportantScriptsForEarlyGame.includes(x.name))
    .filter(x => !x.name.startsWith(notImportantFolder));

  const mostExpensiveEarlyGame = earlyGameScriptsUsage[0];
  const ramToReserveInLimitedEnvironment = coordinator.ram + mostExpensiveEarlyGame.ram;
  const earlyGameLimiter = mostExpensiveEarlyGame.name;

  const ramReserveFile = 'data/ramToReserveOnHome.txt';


  ns.rm(ramReserveFile);
  ns.write(ramReserveFile, JSON.stringify({ramToReserve, ramToReserveInLimitedEnvironment, earlyGameLimiter}), "W");

  const ownedAugmentations = ns.singularity.getOwnedAugmentations(true);

  const ownedAugsTextFileName = "data/ownedAugs.txt";
  ns.rm(ownedAugsTextFileName);
  ns.write(ownedAugsTextFileName, JSON.stringify(ownedAugmentations), "W");
  
}

class ScriptRam {
  constructor(ram, name) {
    this.ram = ram;
    this.name = name;
  }
}