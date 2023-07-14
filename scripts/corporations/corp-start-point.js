export async function main(ns) {

    if(ns.corporation.hasCorporation()){
        ns.run('scropts/corporation/expand.js');
    } else {
        ns.run('scripts/corporation/start-company.js');
    }

}

