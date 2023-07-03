/** @param {NS} ns */
export async function main(ns) {
    ns.tprint(ns.getScriptRam('scripts/coordinator.js'))
    ns.tprint(ns.getScriptRam('scripts/singularity/singularity-coordinator.js'))
  
      ns.tprint(ns.ls("home")
        .filter(x => x.endsWith(".js"))
        .map(x => new something (ns.getScriptRam(x), x))
        .sort((a,b) => a.ram - b.ram));
        
  }
  
  class something {
    constructor(ram, name){
      this.ram = ram;
      this.name = name;
    }
  }