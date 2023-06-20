// $6 million a second with purchase machines going

/** @param {NS} ns */
//run scripts/dispatch.js 
export async function main(ns) {
  const hackingScript = 'scripts/early-hack.js';

  const helpers = new Helpers(ns);

  const portsWeCanPop = helpers.numberOfPortsWeCanPop();
  const currentHackingLevel = ns.getHackingLevel()
  const ramUsageOfHackingScript = ns.getScriptRam(hackingScript);
  const nameOfMostValuableServersFile = 'mostValuableServers.txt';
  const numberOfMachinesToHack = 10;

  const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
  const hackableMachines = enviroment
    .filter(x => x.server.requiredHackingSkill < currentHackingLevel)
    .filter(x => x.server.numOpenPortsRequired <= portsWeCanPop || x.server.purchasedByPlayer);

  let mostValuableServers;

  if (ns.fileExists(nameOfMostValuableServersFile)) {
    mostValuableServers = JSON.parse(ns.read(nameOfMostValuableServersFile));
  } else {
    mostValuableServers = hackableMachines
      .sort((a, b) => b.server.moneyMax - a.server.moneyMax)
      .slice(0, numberOfMachinesToHack)
      .map(x => new HackedRecord(
        x.name,
        x.server.moneyMax,
        x.server.minDifficulty
      ));
  }

  hackableMachines
    .filter(x => !x.server.hasAdminRights)
    .map(x => helpers.hackMachine(x.name));


  const machinesThatNeedProgramsRunning = hackableMachines
    .filter(x => x.server.ramUsed === 0 && x.server.maxRam > 0)
    .sort((a, b) => b.server.maxRam - a.server.maxRam);

  machinesThatNeedProgramsRunning.map(x => {
    let targetArray = mostValuableServers
      .filter(y => y.totalThreadsHacking === 0);

    if (targetArray.length === 0) {
      targetArray = mostValuableServers
        .sort((a, b) => a.totalThreadsHacking - b.totalThreadsHacking);
    }

    const target = targetArray[0];

    let threadsNeeded = Math.floor(x.server.maxRam / ramUsageOfHackingScript)
    ns.scp(hackingScript, x.name);
    ns.exec(hackingScript, x.name, threadsNeeded, target.name, target.moneyThreshhold, target.securityThreshholdTarget);

    target.totalThreadsHacking += threadsNeeded;

  });

  ns.rm(nameOfMostValuableServersFile)
  ns.write(nameOfMostValuableServersFile, JSON.stringify(mostValuableServers), "W")

  ns.run("scripts/scan.js")
}

export class HackedRecord {
  constructor(name, maxMoney, minSecurityThreashhold) {
    this.name = name;
    this.totalThreadsHacking = 0;
    this.moneyThreshhold = maxMoney * 0.75;
    this.securityThreshholdTarget = minSecurityThreashhold + 5;
  }
}

export class Helpers {
  constructor(ns) {
    this.ns = ns;
  }

  hackMachine(hostName) {
    if (this.fileExists("BruteSSH.exe")) {
      this.ns.brutessh(hostName);
    }

    if (this.fileExists("FTPCrack.exe")) {
      this.ns.ftpcrack(hostName);
    }

    if (this.fileExists("relaySMTP.exe")) {
      this.ns.relaysmtp(hostName)
    }

    if (this.fileExists("HTTPWorm.exe")) {
      this.ns.httpworm(hostName)
    }

    if (this.fileExists("SQLInject.exe")) {
      this.ns.sqlinject(hostName)
    }

    this.ns.nuke(hostName);
    this.ns.killall(hostName);

    if (hostName !== "home") {
      this.ns
        .ls(hostName, '.js')
        .map(y => this.ns.rm(y, hostName))
    }
  }

  numberOfPortsWeCanPop() {
    let portsWeCanPop = 0;
    if (this.fileExists("BruteSSH.exe")) {
      portsWeCanPop++;
    }

    if (this.fileExists("FTPCrack.exe")) {
      portsWeCanPop++;
    }

    if (this.fileExists("relaySMTP.exe")) {
      portsWeCanPop++;
    }

    if (this.fileExists("HTTPWorm.exe")) {
      portsWeCanPop++;
    }

    if (this.fileExists("SQLInject.exe")) {
      portsWeCanPop++;
    }

    return portsWeCanPop;
  }

  fileExists(fileName) {
    return this.ns.fileExists(fileName, "home");
  }
}

