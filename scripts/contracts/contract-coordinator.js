export async function main(ns) {

    ns.run('scripts/contracts/get.js');
    await ns.sleep(200);

    ns.run('scripts/contracts/populate-input.js')
    await ns.sleep(200);

    ns.run('scripts/contracts/populate-description.js')
    await ns.sleep(200);

    ns.run('scripts/contracts/do.js')
    await ns.sleep(200);

    ns.run('scripts/contracts/save-contracts-for-thomas.js')
}