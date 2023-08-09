export async function main(ns) {

    let scriptsToRun = [];

    const basicScripts = [
        'scripts/scan.js',
        'scripts/hacking/batch-dispatch.js',
        'scripts/hacking/memory-starved-dispatch.js',
        'scripts/hacking/hack-all-machines.js',
        'scripts/precalculate-important-data.js',
        'scripts/script-registry.js',
    ];

    scriptsToRun = scriptsToRun.concat(basicScripts);

    const stockScripts = [
        'scripts/stock/get-stock-quotes.js',
        'scripts/stock/second-part-of-quotes.js',
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

    const playerScripts = [
        'scripts/player/player-and-priority.js',
        'scripts/player/study.js',
        'scripts/player/create-programs.js',
    ];
    
    scriptsToRun = scriptsToRun.concat(playerScripts);

    const singularityScripts = [
        'scripts/singularity/join-organziations.js',
        'scripts/singularity/apply-to-jobs.js',
        'scripts/singularity/do-work-get-augments.js',
        'scripts/singularity/backdoor-all-machines.js',
        'scripts/singularity/do-work.js',
        'scripts/singularity/finish-round.js',
        'scripts/singularity/finish-bitnode.js',
        'scripts/singularity/do-job.js',
        'scripts/singularity/workout.js',
        'scripts/singularity/upgade-home-machine.js',
        'scripts/singularity/travel-to-get-augs.js',
        'scripts/singularity/graft.js',
        'scripts/singularity/do-crime.js',
    ];
    
    scriptsToRun = scriptsToRun.concat(singularityScripts);

    const investmentScripts = [
        'scripts/investments/invest-in-nodes.js',
        'scripts/investments/purchase-server.js',
        'scripts/investments/invest-in-programs.js',
    ];

    scriptsToRun = scriptsToRun.concat(investmentScripts);

    const corporateScripts = [
        'scripts/corporations/product-management.js',
        'scripts/corporations/invest.js',
        'scripts/corporations/start-company.js',
        'scripts/corporations/get-corporate-info.js',
        'scripts/corporations/add-supporting-material.js',
        'scripts/corporations/upgrade-offices.js',
        'scripts/corporations/upgrade-warehouse.js',
        'scripts/corporations/research.js',
        'scripts/corporations/tea-party.js',
        'scripts/corporations/adjust-prices-export.js',
        'scripts/corporations/get-investments.js',
        'scripts/corporations/bribe-factions.js', 
        'scripts/corporations/expand.js',
        'scripts/corporations/juice-investments.js',
    ];

    scriptsToRun = scriptsToRun.concat(corporateScripts);

    const sleevesScripts = [
        'scripts/sleeves/setSeevesToIdle.js',//setSeevesToIdle
        'scripts/sleeves/countAndPriority.js',
        'scripts/sleeves/getSleeves.js',
        'scripts/sleeves/getTask.js',
        'scripts/sleeves/synchronize.js', 
        'scripts/sleeves/shockRecovery.js',
        'scripts/sleeves/company/do.js',
        'scripts/sleeves/company/train.js',
        'scripts/sleeves/mirror/faction.js',
        'scripts/sleeves/mirror/university.js',
        'scripts/sleeves/mirror/gym.js',
        'scripts/sleeves/crime/calculateCrimes.js',
        'scripts/sleeves/crime/do.js',
        'scripts/sleeves/crime/gym.js',
        'scripts/sleeves/crime/university.js',
        'scripts/sleeves/installAugments.js',
    ];

    scriptsToRun = scriptsToRun.concat(sleevesScripts);
    
    const scriptsFile = 'data/scriptsToRun.txt';
    ns.rm(scriptsFile);
    ns.write(scriptsFile, JSON.stringify(scriptsToRun), "W");
}