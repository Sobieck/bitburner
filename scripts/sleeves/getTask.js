export async function main(ns) {
    const sleevesFile = 'data/sleeves.txt';
    let sleevesData = JSON.parse(ns.read(sleevesFile));


    for (let sleeve of sleevesData.sleeves) {
        sleeve.task = ns.sleeve.getTask(sleeve.name);
    
        if(sleeve.task === null){
            ns.sleeve.setToUniversityCourse(sleeve.name, ns.enums.LocationName.Sector12RothmanUniversity, ns.enums.UniversityClassType.algorithms);
        }
    }

    ns.rm(sleevesFile);
    ns.write(sleevesFile, JSON.stringify(sleevesData), "W");
}