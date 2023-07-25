export async function main(ns) {

    const corporation = ns.corporation.getCorporation();

    const materialWeAreConcernedAbout = "Food";

    const foods = corporation
        .divisions
        .map(x => ns.corporation.getDivision(x))
        .filter(x => x.makesProducts === false)
        .map(x => x.cities.map(city => ns.corporation.getMaterial(x.name, city, materialWeAreConcernedAbout)))
        .reduce((acc, x) => acc.concat(x), []);

    ns.rm("junk.txt");
    ns.write("junk.txt", JSON.stringify(foods), "W");

}