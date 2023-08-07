export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));
       
    sleevesData.sleeves = [];

    for (let i = 0; i < sleevesData.numberOfSleeves; i++) {
        const sleeve = ns.sleeve.getSleeve(i);
        sleeve.name = i;

        if(sleeve.name % 2 === 0){
            sleeve.pair = sleeve.name + 1;
        } else {
            sleeve.pair = sleeve.name - 1;
        }

        sleevesData.sleeves.push(sleeve);
    }


    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}