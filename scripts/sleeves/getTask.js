export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));


    for (let sleeve of sleevesData.sleeves) {
        sleeve.task = ns.sleeve.getTask(sleeve.name);
    }

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}