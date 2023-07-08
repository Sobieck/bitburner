export async function main(ns) {
    
    const doNoDeleteFolders = [];

    for (const textFile of ns.ls("home", ".js")) {
        if(!doNoDeleteFolders.find(x => textFile.startsWith(x))){
            ns.rm(textFile);
        }
    }

}