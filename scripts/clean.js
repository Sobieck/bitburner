//run scripts/clean.js 
export async function main(ns) {
    let newMachine = false;

    if (ns.args[0] === "new") {
        newMachine = true;
    }

    
    if (!newMachine) {
        ns.killall("home", true);

        const enviroment = JSON.parse(ns.read("data/enviroment.txt"));
        enviroment
            .filter(x => x.server.hasAdminRights)
            .map(target => {
                ns.killall(target.name);
            })
    }

    const doNoDeleteFolders = ["analytics", "contracts"]


    for (const textFile of ns.ls("home", ".txt")) {
        if(!doNoDeleteFolders.find(x => textFile.startsWith(x))){
            ns.rm(textFile);
        }
    }
}