export async function main(ns) {
    if (!ns.corporation.hasCorporation()) {
        return;
    }

    const corporation = ns.corporation.getCorporation();
    const divisionsToOperateOn = corporation.divisions.filter(divisionName => divisionName !== "Gidget's Farm");

    const employeeGoals = [
        { type: "Operations", number: 4 },
        { type: "Engineer", number: 4 },
        { type: "Business", number: 2 },
        { type: "Management", number: 4 },
        { type: "Research & Development", number: 4 }
    ];

    const aevumEmployeeGoal = [
        { type: "Operations", number: 12 },
        { type: "Engineer", number: 12 },
        { type: "Business", number: 12 },
        { type: "Management", number: 12 },
        { type: "Research & Development", number: 12 }
    ];

    const aevumEmployeeCountGoal = 60;
    const otherEmployeeCountGoal = 18;

    for (const divisionName of divisionsToOperateOn) {
        const aevum = "Aevum";
        const aevumOffice = ns.corporation.getOffice(divisionName, aevum);

        upgradeOffice(aevumOffice, aevumEmployeeCountGoal, ns, divisionName, aevum);
        
        hireEmployees(aevumOffice, aevumEmployeeGoal, ns, divisionName, aevum);

        const division = ns.corporation.getDivision(divisionName);

        const officesWhoArentAevum = division.cities.filter(city => city !== aevum);

        for (const city of officesWhoArentAevum) {
            const office = ns.corporation.getOffice(divisionName, city);

            upgradeOffice(office, otherEmployeeCountGoal, ns, divisionName, city);
            hireEmployees(office, employeeGoals, ns, divisionName, city);
        }
    }
}

function hireEmployees(office, employeeJobsGoal, ns, division, city) {
    for (let [type, numberOfEmployees] of Object.entries(office.employeeJobs)) {
        const goal = employeeJobsGoal.find(x => x.type === type);

        if (goal) {
            if (numberOfEmployees < goal.number) {
                ns.corporation.hireEmployee(division, city, type);
            }
        }
    }
}

function upgradeOffice(office, countGoal, ns, division, city) {
    if (office.size < countGoal) {
        ns.corporation.upgradeOfficeSize(division, city, 3);
    }
}
