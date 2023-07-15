export async function main(ns) {
    if(!ns.corporation.hasCorporation()){
        return;
    }
    
    
    ns.corporation.expandIndustry("Agriculture", "Gidget's Farm");

}