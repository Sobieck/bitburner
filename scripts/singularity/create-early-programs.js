export async function main(ns) {
    const currentWork = ns.singularity.getCurrentWork();

    if (!currentWork || currentWork.type !== "CREATE_PROGRAM") {
        if (!ns.fileExists("BruteSSH.exe")) {
           ns.singularity.createProgram("BruteSSH.exe", true);

        }

        if (!ns.fileExists("FTPCrack.exe")) {
           ns.singularity.createProgram("FTPCrack.exe", true);
        }

        if (!ns.fileExists("relaySMTP.exe")) {
            ns.singularity.createProgram("relaySMTP.exe", true);
 
         }
 
         if (!ns.fileExists("SQLInject.exe")) {
            ns.singularity.createProgram("SQLInject.exe", true);
         }

         if (!ns.fileExists("HTTPWorm.exe")) {
            ns.singularity.createProgram("HTTPWorm.exe", true);
 
         }
 
         if (!ns.fileExists("Formulas.exe")) {
            ns.singularity.createProgram("Formulas.exe", true);
         }
    }
}