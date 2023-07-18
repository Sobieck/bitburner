export async function main(ns) {
    if(!ns.corporation.hasCorporation()){
        return;
    }

    const corporationFileName = 'data/corporation.txt';

    const hasDoneAction = false;
    const constants = ns.corporation.getConstants();
    const corporation = ns.corporation.getCorporation();
    const divisions = [];
    const offices = [];
    const warehouses = [];

    for (const divisionName of corporation.divisions) {
        const division = ns.corporation.getDivision(divisionName)
        divisions.push(division);

        for(const city of division.cities){
            offices.push(ns.corporation.getOffice(division.name, city));
            if(ns.corporation.hasWarehouse(division.name, city)){
                warehouses.push(ns.corporation.getWarehouse(division.name, city));
            }
        }
    }

    const corporationData = { constants, hasDoneAction, corporation, divisions, offices, warehouses };
    
    ns.rm(corporationFileName);
    ns.write(corporationFileName, JSON.stringify(corporationData), "W");
}