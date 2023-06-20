/** run scripts/move-scripts.js target */
export async function main(ns) {
    const target = ns.args[0];
  
    ns.scp('scripts/early-hack.js', target);
    ns.scp('scripts/dispatch.js', target);
    ns.scp('scripts/move-scripts.js', target);
  
    if (ns.fileExists("BruteSSH.exe", "home")) {
      ns.brutessh(target);
    }
  
    if (ns.fileExists("FTPCrack.exe", "home")) {
      ns.ftpcrack(target);
    }
  
    ns.nuke(target);
    ns.killall(target);
  }