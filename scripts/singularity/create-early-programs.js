export async function main(ns) {
    const currentWork = ns.singularity.getCurrentWork();

    if (!currentWork || currentWork.type !== "CREATE_PROGRAM") {
        if (!ns.fileExists("BruteSSH.exe")) {
           ns.singularity.createProgram("BruteSSH.exe", true);

        }

        if (!ns.fileExists("FTPCrack.exe")) {
           ns.singularity.createProgram("FTPCrack.exe", true);
        }
    }
}