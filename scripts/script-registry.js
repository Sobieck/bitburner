export async function main(ns) {

    let scriptsToRun = [];

    const basicScripts = [
        'scripts/hacking/hack-all-machines.js',
        'scripts/precalculate-important-data.js',
        'scripts/script-registry.js',
    ];

    scriptsToRun = scriptsToRun.concat(basicScripts);

    const stockScripts = [
        'scripts/stock/get-stock-quotes.js',
        'scripts/stock/populate-forecast.js',
        'scripts/stock/invest-in-stocks.js',
        'scripts/stock/buy-4s.js',
    ];

    scriptsToRun = scriptsToRun.concat(stockScripts);

    const contractScripts = [
        'scripts/contracts/get.js',
        'scripts/contracts/populate-input.js',
        'scripts/contracts/populate-description.js',
        'scripts/contracts/do.js',
        'scripts/contracts/save-contracts-for-thomas.js',
    ];

    scriptsToRun = scriptsToRun.concat(contractScripts);

    const singularityScripts = [
        'scripts/singularity/backdoor-all-machines.js',
        'scripts/singularity/join-organziations.js',
        'scripts/singularity/do-work.js',
        'scripts/singularity/finish-round.js',
        'scripts/singularity/finish-bitnode.js',
        'scripts/singularity/study-computer-science.js',
        'scripts/singularity/create-early-programs.js',
        'scripts/singularity/do-job.js',
        'scripts/singularity/buy-rep.js',
        'scripts/singularity/workout.js',
        'scripts/singularity/upgade-home-machine.js',
        'scripts/singularity/travel-to-get-augs.js',
    ];
    
    scriptsToRun = scriptsToRun.concat(singularityScripts);

    const investmentScripts = [
        'scripts/investments/invest-in-nodes.js',
        'scripts/investments/purchase-server.js',
        'scripts/investments/invest-in-programs.js',
    ];

    scriptsToRun = scriptsToRun.concat(investmentScripts);

    const corporateScripts = [
        'scripts/corporations/start-company.js',
        'scripts/corporations/get-corporate-info.js',
        'scripts/corporations/initial-expand.js',
    ];

    scriptsToRun = scriptsToRun.concat(corporateScripts);
    
    const scriptsFile = 'data/scriptsToRun.txt';
    ns.rm(scriptsFile);
    ns.write(scriptsFile, JSON.stringify(scriptsToRun), "W");
}