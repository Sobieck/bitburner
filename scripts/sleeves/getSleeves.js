export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));
       
    sleevesData.sleeves = [];

    for (let i = 0; i < sleevesData.numberOfSleeves; i++) {
        let sleeve = ns.sleeve.getSleeve(i);
        sleeve.name = i;

        sleevesData.sleeves.push(sleeve);
    }


    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}