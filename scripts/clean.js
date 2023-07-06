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

    for (const textFile of ns.ls("home", ".txt")) {
        ns.rm(textFile);
    }
}