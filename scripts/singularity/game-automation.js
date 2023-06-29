export async function main(ns) {

    const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
    const me = ns.getPlayer();
    const currentWork = ns.singularity.getCurrentWork();

    // buy programs first

    // create programs
    // {"type":"CREATE_PROGRAM","cyclesWorked":573,"programName":"FTPCrack.exe"}
    if(currentWork.type !== "CREATE_PROGRAM"){
        if (!ns.fileExists("BruteSSH.exe")) {
            ns.singularity.createProgram("BruteSSH.exe", true);
        }
    
        if (!ns.fileExists("FTPCrack.exe")) {
            ns.singularity.createProgram("FTPCrack.exe", true);
        }
    
        if (!ns.fileExists("relaySMTP.exe")) {
            ns.singularity.createProgram("relaySMTP.exe", true);
        }
    
        if (!ns.fileExists("HTTPWorm.exe")) {
            ns.singularity.createProgram("HTTPWorm.exe", true);
        }
    
        if (!ns.fileExists("SQLInject.exe")) {
            ns.singularity.createProgram("SQLInject.exe", true);
        }
    }


    // buy memory 

    // join organizations


    // buy augmentations

}


