/**
* NOTE: global variables from files like rates.js and structural-script.js are accessible because of html <script> tag
* kW (kilowatts): This measures real or working power, the actual work done by electrical equipment,
* kVAR (kilovolt-amperes reactive): This measures reactive power, the part of electricity that
does no useful work but is necessary to maintain the voltage levels for the system.
* kVA (kilovolt-amperes): This measures apparent power, which includes both real power (kW) and reactive power (kVAR)
*/

let electricFormData = {
    // ALL
    kWhTotalMonthlyEnergyUsage: 0,
    // ONLY residential
    familyType: false,
    numberOfResidentElectricVehicles: 0,
    // ONLY largeCommercialTOUGS3, industrialTOU8
    kWSummerOnPeakDemand: 0,
    kWSummerMidPeakDemand: 0,
    // ONLY largeCommercialTOUGS3, industrialTOU8, pumpingAndAgriculture
    kWhSummerOnPeakEnergyUsage: 0,
    kWhSummerMidPeakEnergyUsage: 0,
    kWhSummerOffPeakEnergyUsage: 0,
    kWhWinterMidPeakEnergyUsage: 0,
    kWhWinterOffPeakEnergyUsage: 0,
    // ONLY largeCommercialTOUGS3, industrialTOU8, pumpingAndAgriculture, mediumCommercialGS2
    kWFacilitiesRelatedDemand: 0,
    // ONLY largeCommercialTOUGS3, industrialTOU8, pumpingAndAgriculture, commercialEVChargingRate
    kVARReactivePower: 0,
    // ONLY largeCommercialTOUGS3, industrialTOU8, pumpingAndAgriculture, mediumCommercialGS2, commercialEVChargingRate
    kWPeakFrom4PMto9PMDemand: 0,
    // ONLY smallCommercialGS1, trafficControlTC1
    phaseType: '',
    // ONLY commercialEVChargingRate
    kWMonthDemandPeak: 0,
    kWhEnergyOnPeak4To9PMEnergyUsage: 0,
    kWhEnergyOffPeak4To9PMEnergyUsage: 0,
    // ONLY commercialEVChargingRate (for bills before 2025 trying to calculate kWhEnergyOnPeak4To9PMEnergyUsage)
    kWhSummerOnPeakCalculator: 0,
    kWhSummerMidPeakCalculator: 0,
    kWhWinterMidPeakCalculator: 0,
};

const kWhSummerOnPeakCalculatorInput = document.getElementById('summer-on-peak-energy-calculator-input');
const kWhSummerMidPeakCalculatorInput = document.getElementById('summer-mid-peak-energy-calculator-input');
const kWhWinterMidPeakCalculatorInput = document.getElementById('winter-mid-peak-energy-calculator-input');

kWhSummerOnPeakCalculatorInput.addEventListener('change', (event) => electricFormData.kWhSummerOnPeakCalculator = +event?.target.value);
kWhSummerMidPeakCalculatorInput.addEventListener('change', (event) => electricFormData.kWhSummerMidPeakCalculator = +event?.target.value);
kWhWinterMidPeakCalculatorInput.addEventListener('change', (event) => electricFormData.kWhWinterMidPeakCalculator = +event?.target.value);


const kWhEnergyOnPeak4To9PMEnergyUsageEstimator = (season) => {
    const averageAmountOfMonthlyWeekdays = 21.74;
    const averageAmountOfMonthlyWeekendDays = 8.7;

    const kWhSummer4To9PMPeakUsageEstimate = kWhSummerOnPeakCalculatorInput + kWhSummerMidPeakCalculatorInput;
    
    const kWhWinter4To9PMPeakPerWeekdayEstimate = kWhWinterMidPeakCalculatorInput / averageAmountOfMonthlyWeekdays;
    const kWhWinter4To9PMPeakWeekendsEstimate = kWhWinter4To9PMPeakPerWeekdayEstimate * averageAmountOfMonthlyWeekendDays;
    const kWhWinter4To9PMPeakUsageEstimate = kWhWinterMidPeakCalculatorInput + kWhWinter4To9PMPeakWeekendsEstimate;

    return season === 'Summer' ? kWhSummer4To9PMPeakUsageEstimate : kWhWinter4To9PMPeakUsageEstimate;
}

const setElectricFormData = (event) => {
    const formData = new FormData(event.currentTarget);
    const formDataEntries = Array.from(formData.entries());
    
    electricFormData = Object.fromEntries(formDataEntries);
    
    for (const [key, value] of formDataEntries) {
        if (value === 'true') electricFormData[key] = true;
        else if (value === 'false') electricFormData[key] = false;
        else if (!isNaN(value) && value.trim() !== '') electricFormData[key] = Number(value);
        else electricFormData[key] = value;
    }
}

const findVariableElectricCharge = (year, season) => {
    const residentialRates = electricRates.residential;
    let kWhBaseline = (season === 'Summer') ? residentialRates.kWhSummerBaseline : residentialRates.kWhWinterBaseline;
    const totalElectricVehiclesBoost = electricFormData.numberOfResidentElectricVehicles * residentialRates.kWhElectricVehicleBaselineBoost;
    kWhBaseline += totalElectricVehiclesBoost;
    
    const tierBilling = { tier1: 0, tier2: 0, tier3: 0, tier4: 0 };
    
    // console.log(kWhBaseline, electricFormData.kWhTotalMonthlyEnergyUsage);

    for (let kWhAccruedUsage = 0; kWhAccruedUsage < electricFormData.kWhTotalMonthlyEnergyUsage; kWhAccruedUsage += 0.001) {
        if (year === 2024) {
            if (kWhAccruedUsage <= kWhBaseline) tierBilling['tier1'] += 0.001;
            else if (kWhBaseline < kWhAccruedUsage && kWhAccruedUsage <= (kWhBaseline * 1.30)) tierBilling['tier2'] += 0.001;
            else if ((kWhBaseline * 1.30) < kWhAccruedUsage && kWhAccruedUsage <= (kWhBaseline * 2.00)) tierBilling['tier3'] += 0.001;
            else if ((kWhBaseline * 2.00) < kWhAccruedUsage) tierBilling['tier4'] += 0.001;
        } else {
            if (kWhAccruedUsage <= kWhBaseline) tierBilling['tier1'] += 0.001;
            else if (kWhBaseline < kWhAccruedUsage && kWhAccruedUsage <= (kWhBaseline * 1.30)) tierBilling['tier2'] += 0.001;
            else if ((kWhBaseline * 1.30) < kWhAccruedUsage) tierBilling['tier3'] += 0.001;
        }
    }

    const tierBillingEntries = Object.entries(tierBilling);
    
    // console.log(tierBillingEntries);

    const tierBillingCosts = tierBillingEntries.map(([tier, units]) => {
        const tierRate = electricRates.residential[year][tier];
        if (tierRate) { 
            return operate({
                operandValues: [tierRate, units],
                operandNames: [`${tier.toUpperCase()} Rate`, 'kWh Usage'],
                operator: '*',
                category: `${year} ${season.toUpperCase()} Estimated Charges`,
            });
        } else return 0;
    });

    return getArraySum(tierBillingCosts);
}

const findElectricFixedUsageAndDemandRates = (year, season) => {
    let fixedTotalCharges = 0;
    let kWTotalCharges = 0;
    let kWhTotalCharges = 0;
    let totalPublicBenefitsCharges = 0;
    let isTaxedByState = true;
    
    if (customerClass === 'residential') {
        const customerClassAndYear = electricRates[customerClass][year];

        const fixedCost = year === 2024 ? 
            customerClassAndYear.fixed[electricFormData.familyType] :
            customerClassAndYear.fixed;
        const publicBenefitsCost = year === 2024 ? 
            0 :
            customerClassAndYear.publicBenefits * electricFormData.kWhTotalMonthlyEnergyUsage;

        fixedTotalCharges += fixedCost;
        kWhTotalCharges += findVariableElectricCharge(year, season);
        kWhTotalCharges += publicBenefitsCost;
    } else if (['smallCommercialGS1', 'trafficControlTC1'].includes(customerClass)) {
        const customerClassAndYear = electricRates[customerClass][year];

        // *Note: total cost for Three Phase customer will include Single Phase rate plus Three Phase rate.
        fixedTotalCharges += (electricFormData.phaseType === 'singlePhase' ?
            customerClassAndYear.fixed[electricFormData.phaseType] :
            getArraySum(Object.values(customerClassAndYear.fixed)));
        if (year === 2024 && customerClass === 'smallCommercialGS1') {
            kWhTotalCharges += customerClassAndYear.variable[season] * electricFormData.kWhTotalMonthlyEnergyUsage;
        } else {
            kWhTotalCharges += customerClassAndYear.variable * electricFormData.kWhTotalMonthlyEnergyUsage
        };
        totalPublicBenefitsCharges += (year === 2024 ? 0 : customerClassAndYear.publicBenefits * electricFormData.kWhTotalMonthlyEnergyUsage);
    } else if (customerClass === 'mediumCommercialGS2') {
        const customerClassAndYear = electricRates[customerClass][year];
        
        fixedTotalCharges += customerClassAndYear.fixed;

        const kWPowerSupplyPeakDemandCost = electricFormData.kWPeakFrom4PMto9PMDemand * customerClassAndYear.kWDemandPowerSupplyPeak;
        const kWDistributionFacilitiesDemandCost = electricFormData.kWFacilitiesRelatedDemand * customerClassAndYear.kwDemandDistributionFacilities;
        const demandCosts = kWPowerSupplyPeakDemandCost + kWDistributionFacilitiesDemandCost;
        
        // **Summer Peak is used for current rates: 4-9 pm during summer months. Peak will be used for proposed rates: 4-9 pm year-round.
        if (year === 2024) {
            kWTotalCharges += (season === 'Summer' ? kWPowerSupplyPeakDemandCost : 0);
            kWTotalCharges +=  kWDistributionFacilitiesDemandCost;
            kWhTotalCharges += customerClassAndYear.variable[season] * electricFormData.kWhTotalMonthlyEnergyUsage;
        } else {
            kWTotalCharges += demandCosts;
            kWhTotalCharges += customerClassAndYear.variable * electricFormData.kWhTotalMonthlyEnergyUsage;
            totalPublicBenefitsCharges += customerClassAndYear.publicBenefits * electricFormData.kWhTotalMonthlyEnergyUsage
        }
    } else if (['largeCommercialTOUGS3', 'industrialTOU8', 'pumpingAndAgriculture'].includes(customerClass)) {
        const isSummer = season === 'Summer';
        const isPumpingAndAgriculture = customerClass === 'pumpingAndAgriculture';
        const customerClassAndYear = electricRates[customerClass][year];

        let kWDemandPowerSupplyPeak = 0;
        let kWDemandDistributionFacilities = 0;

        if (year === 2024 && !isPumpingAndAgriculture) {
            kWDemandPowerSupplyPeak = customerClassAndYear.kWDemandPowerSupplyPeak[season];
            kWDemandDistributionFacilities = customerClassAndYear.kWDemandDistributionFacilities;
        } else if (year === 2025 && !isSummer && isPumpingAndAgriculture) {
            kWDemandPowerSupplyPeak = customerClassAndYear.kWDemandPowerSupplyPeak.january;
            kWDemandDistributionFacilities = customerClassAndYear.kWDemandDistributionFacilities.january;
        } else if (year === 2025 && isSummer && isPumpingAndAgriculture) { 
            kWDemandPowerSupplyPeak = customerClassAndYear.kWDemandPowerSupplyPeak.july;
            kWDemandDistributionFacilities = customerClassAndYear.kWDemandDistributionFacilities.july;
        } else {
            kWDemandPowerSupplyPeak = customerClassAndYear.kWDemandPowerSupplyPeak;
            kWDemandDistributionFacilities = customerClassAndYear.kWDemandDistributionFacilities;
        }

        const kWPowerSupplyPeakDemandCost = electricFormData.kWPeakFrom4PMto9PMDemand * kWDemandPowerSupplyPeak;
        const kWDistributionFacilitiesDemandCost = electricFormData.kWFacilitiesRelatedDemand * kWDemandDistributionFacilities;
        const kWPeakReactiveDemandCost = electricFormData.kVARReactivePower * customerClassAndYear.powerFactorAdjustment;
        const demandCosts = kWPowerSupplyPeakDemandCost + kWDistributionFacilitiesDemandCost + kWPeakReactiveDemandCost;
        
        fixedTotalCharges += customerClassAndYear.fixed;

        if (isSummer) {
            kWhTotalCharges += customerClassAndYear.variable.summerOnPeak * electricFormData.kWhSummerOnPeakEnergyUsage; 
            kWhTotalCharges += customerClassAndYear.variable.summerMidPeak * electricFormData.kWhSummerMidPeakEnergyUsage; 
            kWhTotalCharges += customerClassAndYear.variable.summerOffPeak * electricFormData.kWhSummerOffPeakEnergyUsage; 
        } else {
            kWhTotalCharges += customerClassAndYear.variable.winterMidPeak * electricFormData.kWhWinterMidPeakEnergyUsage; 
            kWhTotalCharges += customerClassAndYear.variable.winterOffPeak * electricFormData.kWhWinterOffPeakEnergyUsage; 
        }
        
        // ***Summer Peak and Summer Mid-Peak are used for current rates. Peak will be used for proposed rates: 4-9 pm year-round.
        if (year === 2024 && !isPumpingAndAgriculture) {
            kWTotalCharges += (isSummer ? customerClassAndYear.kWDemandPowerSupplyPeak.summerOnPeak * electricFormData.kWSummerOnPeakDemand: 0);
            kWTotalCharges += (isSummer ? customerClassAndYear.kWDemandPowerSupplyPeak.summerMidPeak * electricFormData.kWSummerMidPeakDemand: 0);
            kWTotalCharges += customerClassAndYear.kWDemandDistributionFacilities * electricFormData.kWFacilitiesRelatedDemand;
        } else {
            kWTotalCharges += demandCosts;
            totalPublicBenefitsCharges += customerClassAndYear.publicBenefits * electricFormData.kWhTotalMonthlyEnergyUsage;
        }
    } else if (['outdoorAreaLightingAL2', 'streetLightingLS3'].includes(customerClass)) {
        const customerClassAndYear = electricRates[customerClass][year];
        fixedTotalCharges += customerClassAndYear.fixed;
        kWhTotalCharges += customerClassAndYear.variable * electricFormData.kWhTotalMonthlyEnergyUsage;
        totalPublicBenefitsCharges += (year === 2024 ? 0 : customerClassAndYear.publicBenefits * electricFormData.kWhTotalMonthlyEnergyUsage)
    } else if (customerClass === 'commercialEVChargingRate') {
        if (year !== 2024) {
            const customerClassAndYear = electricRates[customerClass][year];
            
            const kWhEnergyOnPeak4to9PM = customerClassAndYear.kWhEnergyOnPeak4to9PM ? customerClassAndYear.kWhEnergyOnPeak4to9PM : kWhEnergyOnPeak4To9PMEnergyUsageEstimator(season);
            const kWPowerSupplyPeakDemandCost = electricFormData.kWMonthDemandPeak * customerClassAndYear.kWDemandMonth;
            const kWPeakReactiveDemandCost = electricFormData.kVARReactivePower * customerClassAndYear.powerFactorAdjustment;
            const demandCosts = kWPowerSupplyPeakDemandCost + kWPeakReactiveDemandCost;
            
            fixedTotalCharges += customerClassAndYear.fixed;

            kWTotalCharges += demandCosts;

            totalPublicBenefitsCharges += customerClassAndYear.publicBenefits * electricFormData.kWhTotalMonthlyEnergyUsage;
            kWhTotalCharges += kWhEnergyOnPeak4to9PM * electricFormData.kWhEnergyOnPeak4To9PMEnergyUsage;
            kWhTotalCharges += customerClassAndYear.kWhEnergyOffPeak * electricFormData.kWhEnergyOffPeak4To9PMEnergyUsage;
        } else isTaxedByState = false;
    } else return 'No customer class found.';
    
    return { fixedTotalCharges, kWTotalCharges, kWhTotalCharges, totalPublicBenefitsCharges, isTaxedByState };
}

const getElectricRate = (event) => {
    setElectricFormData(event);
    const seasons = ['Winter', 'Summer'];
    
    const winterCosts = [];
    const summerCosts = [];
    
    let seasonIndex = 0;
    while (seasonIndex < seasons.length) {
        const season = seasons[seasonIndex].toLowerCase();
        
        for (let year = 2024; year <= 2029; year++) {
            const { fixedTotalCharges, kWTotalCharges, kWhTotalCharges, totalPublicBenefitsCharges, isTaxedByState } = findElectricFixedUsageAndDemandRates(year, season);
            
            const stateTaxCharge = isTaxedByState ? electricRates.kWhStateTax * electricFormData.kWhTotalMonthlyEnergyUsage : 0;
            
            const totalCosts = operate({
                operandValues: [fixedTotalCharges, kWTotalCharges, kWhTotalCharges, totalPublicBenefitsCharges, stateTaxCharge],
                operandNames: ['Fixed Charges', 'kW Charges', 'kWh Charges', 'Public Benefits Charge', 'State Tax Charge'],
                operator: '+',
                category: `${year} ${season.toUpperCase()} Estimated Charges`,
            });

            if (seasonIndex === 0) winterCosts.push(totalCosts);
            else summerCosts.push(totalCosts);
        }
        
        seasonIndex += 1;
    }

    resetCosts();
    costs.push({ seasons, seasonalCosts: [winterCosts, summerCosts] });

    createTable(true);
}

/* NOTE: global variables from files like rates.js and structural-script.js are accessible because of html <script> tag */

const sewerRates = {
    fixed: {
        2024: {
            insideStandardWastewater: 45.60, // 'Residential', 'City Park Restroom', 'Mobile Home Parks (Per Space)'
            insideStandardWastewaterMobileHome: 45.60, // 'Mobile Home Parks (Per Space)'
            motelsAndHotelsPerUnit: 7.59, // 'Motels', 'Hotels'
            motelsAndHotelsPerLivingUnit: 45.60, // 'Motels', 'Hotels'
            retailFoodAndEssentialServicesMeterLessThanOrEqualToOneInch: 163.28, // 'Restaurants', 'Supermarkets', 'Mortuaries', 'Bakeries'
            retailFoodAndEssentialServicesMeterGreaterThanOneInch: 266.34, // 'Restaurants', 'Supermarkets', 'Mortuaries', 'Bakeries'
            laundries: 24.20, // 'Laundries'
            insideCommercial: {
                '5/8"': 45.60,
                '3/4"': 72.02,
                '1"': 103.48,
                '1 1/2"': 186.06,
                '2"': 291.55,
                '3"': 537.41,
                '4"': 875.43,
                '6"': 1753.50,
                '8"': 2820.52,
            },
        },
        2025: 45.46,
        2026: 50.01,
        2027: 55.01,
        2028: 60.51,
        2029: 66.56,
    },
    variable: {
        2025: 5.50,
        2026: 6.05,
        2027: 6.66,
        2028: 7.32,
        2029: 8.05,
    },
}

const waterRates = {
    fixed: {
        domestic: {
            2024: {
                '5/8"': 27.09,
                '3/4"': 36.46,
                '1"': 55.18,
                '1 1/2"': 101.98,
                '2"': 158.13,
                '3"': 335.95,
                '4"': 598.02,
                '6"': 1505.89,
                '8"': 2629.02,
                '10"': 3939.33,
            },
            2025: {
                '5/8"': 32.79,
                '3/4"': 42.94,
                '1"': 63.23,
                '1 1/2"': 113.94,
                '2"': 174.81,
                '3"': 367.54,
                '4"': 651.56,
                '6"': 1635.51,
                '8"': 2852.76,
                '10"': 4272.88,
            },
            2026: {
                '5/8"': 35.75,
                '3/4"': 46.80,
                '1"': 68.92,
                '1 1/2"': 124.20,
                '2"': 190.54,
                '3"': 400.62,
                '4"': 710.20,
                '6"': 1782.70,
                '8"': 3109.51,
                '10"': 4657.44,
            },
            2027: {
                '5/8"': 38.96,
                '3/4"': 51.02,
                '1"': 75.12,
                '1 1/2"': 135.38,
                '2"': 207.69,
                '3"': 436.67,
                '4"': 774.12,
                '6"': 1943.15,
                '8"': 3389.36,
                '10"': 5076.61,
            },
            2028: {
                '5/8"': 42.47,
                '3/4"': 55.61,
                '1"': 81.88,
                '1 1/2"': 147.56,
                '2"': 226.38,
                '3"': 475.97,
                '4"': 843.79,
                '6"': 2118.03,
                '8"': 3694.40,
                '10"': 5533.51,
            },
            2029: {
                '5/8"': 46.29,
                '3/4"': 60.61,
                '1"': 89.25,
                '1 1/2"': 160.84,
                '2"': 246.75,
                '3"': 518.81,
                '4"': 919.74,
                '6"': 2308.65,
                '8"': 4026.90,
                '10"': 6031.52,
            },
        },
        privateFire: {
            2024: {
                '5/8"': 8.60,
                '3/4"': 8.60,
                '1"': 8.60,
                '1 1/2"': 8.60,
                '2"': 9.74,
                '3"': 10.81,
                '4"': 16.76,
                '6"': 32.74,
                '8"': 60.29,
                '10"': 101.72,
            },
            2025: {
                '5/8"': 12.64,
                '3/4"': 12.64,
                '1"': 12.64,
                '1 1/2"': 13.33,
                '2"': 14.91,
                '3"': 17.63,
                '4"': 27.38,
                '6"': 44.20,
                '8"': 69.50,
                '10"': 104.57,
            },
            2026: {
                '5/8"': 13.78,
                '3/4"': 13.78,
                '1"': 13.78,
                '1 1/2"': 14.53,
                '2"': 16.25,
                '3"': 19.21,
                '4"': 29.84,
                '6"': 48.18,
                '8"': 75.76,
                '10"': 113.98,
            },
            2027: {
                '5/8"': 15.02,
                '3/4"': 15.02,
                '1"': 15.02,
                '1 1/2"': 15.84,
                '2"': 17.71,
                '3"': 20.94,
                '4"': 32.53,
                '6"': 52.51,
                '8"': 82.57,
                '10"': 124.24,
            },
            2028: {
                '5/8"': 16.37,
                '3/4"': 16.37,
                '1"': 16.37,
                '1 1/2"': 17.27,
                '2"': 19.31,
                '3"': 22.83,
                '4"': 35.46,
                '6"': 57.24,
                '8"': 90.01,
                '10"': 135.42,
            },
            2029: {
                '5/8"': 17.84,
                '3/4"': 17.84,
                '1"': 17.84,
                '1 1/2"': 18.82,
                '2"': 21.05,
                '3"': 24.88,
                '4"': 38.65,
                '6"': 62.39,
                '8"': 98.11,
                '10"': 147.61,
            },
        },
    },
    variable: {
        residential: {
            2024: {
                tier1: 1.93,
                tier2: 2.77,
                tier3: 5.48,
                tier4: 9.12,
                tier5: 13.59,
            },
            2025: {
                tier1: 1.96,
                tier2: 3.31,
                tier3: 4.38,
                tier4: 5.22,
            },
            2026: {
                tier1: 2.13,
                tier2: 3.60,
                tier3: 4.77,
                tier4: 5.69,
            },
            2027: {
                tier1: 2.32,
                tier2: 3.93,
                tier3: 5.20,
                tier4: 6.20,
            },
            2028: {
                tier1: 2.53,
                tier2: 4.28,
                tier3: 5.67,
                tier4: 6.76,
            },
            2029: {
                tier1: 2.76,
                tier2: 4.67,
                tier3: 6.18,
                tier4: 7.36,
            },
        },
        commercial: {
            2024: {
                tier1: 2.77,
                tier2: 5.48,
                tier3: 9.12,
                tier4: 13.59,
            },
            2025: {
                tier1: 3.31,
                tier2: 3.48,
                tier3: 5.22,
            },
            2026: {
                tier1: 3.60,
                tier2: 4.77,
                tier3: 5.69,
            },
            2027: {
                tier1: 3.93,
                tier2: 5.20,
                tier3: 6.20,
            },
            2028: {
                tier1: 4.28,
                tier2: 5.67,
                tier3: 6.76,
            },
            2029: {
                tier1: 4.67,
                tier2: 6.18,
                tier3: 7.36,
            },
        },
    },
}

const reclaimedWaterRates = {
    fixed: {
        2024: {
            '5/8"': 23.52,
            '3/4"': 30.81,
            '1"': 45.39,
            '1 1/2"': 81.84,
            '2"': 125.59,
            '3"': 264.13,
            '4"': 468.28,
            '6"': 1175.53,
            '8"': 2050.48,
            '10"': 3071.25,
        },
        2025: {
            '5/8"': 26.64,
            '3/4"': 35.95,
            '1"': 54.57,
            '1 1/2"': 101.12,
            '2"': 156.98,
            '3"': 333.88,
            '4"': 594.58,
            '6"': 1497.70,
            '8"': 2614.96,
            '10"': 3918.44,
        },
        2026: {
            '5/8"': 27.70,
            '3/4"': 37.38,
            '1"': 56.75,
            '1 1/2"': 105.16,
            '2"': 163.26,
            '3"': 347.24,
            '4"': 618.36,
            '6"': 1557.61,
            '8"': 2719.56,
            '10"': 4075.17,
        },
        2027: {
            '5/8"': 28.81,
            '3/4"': 38.88,
            '1"': 59.02,
            '1 1/2"': 109.37,
            '2"': 169.79,
            '3"': 361.13,
            '4"': 643.10,
            '6"': 1619.91,
            '8"': 2828.34,
            '10"': 4238.18,
        },
        2028: {
            '5/8"': 29.96,
            '3/4"': 40.43,
            '1"': 61.38,
            '1 1/2"': 113.75,
            '2"': 176.58,
            '3"': 375.57,
            '4"': 668.82,
            '6"': 1684.71,
            '8"': 2941.48,
            '10"': 4407.71,
        },
        2029: {
            '5/8"': 31.16,
            '3/4"': 42.05,
            '1"': 63.84,
            '1 1/2"': 118.30,
            '2"': 183.65,
            '3"': 390.60,
            '4"': 695.57,
            '6"': 1752.10,
            '8"': 3059.14,
            '10"': 4584.02,
        },
    },
    variable: {
        2024: {
            tier1: 2.14,
            tier2: 3.21,
            tier3: 4.27,
            tier4: 6.41,
        },
        2025: {
            tier1: 2.37,
            tier2: 2.60,
        },
        2026: {
            tier1: 2.46,
            tier2: 2.71,
        },
        2027: {
            tier1: 2.56,
            tier2: 2.82,
        },
        2028: {
            tier1: 2.66,
            tier2: 2.93,
        },
        2029: {
            tier1: 2.77,
            tier2: 3.05,
        },
    },
}

const electricRates = {
    residential: {
        2024: {
            fixed: {
                singleFamily: 0.88,
                multiFamily: 0.67,
            },
            tier1: 0.11808,
            tier2: 0.13741,
            tier3: 0.22696,
            tier4: 0.32337,
        },
        2025: {
            fixed: 15.90,
            tier1: 0.10100,
            tier2: 0.11100,
            tier3: 0.21000,
            publicBenefits: 0.00378,
        },
        2026: {
            fixed: 16.54,
            tier1: 0.10504,
            tier2: 0.11544,
            tier3: 0.21840,
            publicBenefits: 0.00405,
        },
        2027: {
            fixed: 17.20,
            tier1: 0.10924,
            tier2: 0.12006,
            tier3: 0.22714,
            publicBenefits: 0.00419,
        },
        2028: {
            fixed: 17.89,
            tier1: 0.11361,
            tier2: 0.12486,
            tier3: 0.23623,
            publicBenefits: 0.00433,
        },
        2029: {
            fixed: 18.61,
            tier1: 0.11815,
            tier2: 0.12985,
            tier3: 0.24568,
            publicBenefits: 0.00448,
        },
        kWhSummerBaseline: 470,
        kWhWinterBaseline: 355,
        kWhElectricVehicleBaselineBoost: 900,
    },
    smallCommercialGS1: {
        2024: {
            fixed: {
                singlePhase: 12.99,
                threePhase: 3.16,
            },
            variable: {
                summer: 0.172800,
                winter: 0.168720,
            }
        },
        2025: {
            fixed: {
                singlePhase: 20.97,
                threePhase: 3.16,
            },
            publicBenefits: 0.00378,
            variable: 0.15500,
        },
        2026: {
            fixed: {
                singlePhase: 21.81,
                threePhase: 3.29,
            },
            publicBenefits: 0.00405,
            variable: 0.16120,
        },
        2027: {
            fixed: {
                singlePhase: 22.68,
                threePhase: 3.42,
            },
            publicBenefits: 0.00419,
            variable: 0.16765,
        },
        2028: {
            fixed: {
                singlePhase: 23.59,
                threePhase: 3.56,
            },
            publicBenefits: 0.00433,
            variable: 0.17436,
        },
        2029: {
            fixed: {
                singlePhase: 24.53,
                threePhase: 3.70,
            },
            publicBenefits: 0.00448,
            variable: 0.18133,
        },
    },
    mediumCommercialGS2: {
        2024: {
            fixed: 71.50,
            kWDemandPowerSupplyPeak: 20.67,
            kwDemandDistributionFacilities: 7.35,
            variable: {
                summer: 0.096480,
                winter: 0.087380,
            },
        },
        2025: {
            fixed: 35.13,
            kWDemandPowerSupplyPeak: 8.27,
            kwDemandDistributionFacilities: 15.74,
            variable: 0.05905,
            publicBenefits: 0.00378,
        },
        2026: {
            fixed: 36.54,
            kWDemandPowerSupplyPeak: 8.60,
            kwDemandDistributionFacilities: 16.37,
            variable: 0.06141,
            publicBenefits: 0.00405,
        },
        2027: {
            fixed: 38.00,
            kWDemandPowerSupplyPeak: 8.94,
            kwDemandDistributionFacilities: 17.02,
            variable: 0.06387,
            publicBenefits: 0.00419,
        },
        2028: {
            fixed: 39.52,
            kWDemandPowerSupplyPeak: 9.30,
            kwDemandDistributionFacilities: 17.70,
            variable: 0.06642,
            publicBenefits: 0.00433,
        },
        2029: {
            fixed: 41.10,
            kWDemandPowerSupplyPeak: 9.67,
            kwDemandDistributionFacilities: 18.41,
            variable: 0.06908,
            publicBenefits: 0.00448,
        },
    },
    largeCommercialTOUGS3: {
        2024: {
            fixed: 277.25,
            kWDemandPowerSupplyPeak: {
                summerOnPeak: 18.16,
                summerMidPeak: 6.23,
            },
            kWDemandDistributionFacilities: 7.62,
            variable: {
                summerOnPeak: 0.13561,
                summerMidPeak: 0.11027,
                summerOffPeak: 0.07706,
                winterMidPeak: 0.11282,
                winterOffPeak: 0.08052,
            },
            powerFactorAdjustment: 0.18000,
        },
        2025: {
            fixed: 49.30,
            kWDemandPowerSupplyPeak: 8.29,
            kWDemandDistributionFacilities: 17.51,
            variable: {
                summerOnPeak: 0.09620,
                summerMidPeak: 0.07280,
                summerOffPeak: 0.05200,
                winterMidPeak: 0.07986,
                winterOffPeak: 0.05200,
            },
            powerFactorAdjustment: 0.18000,
            publicBenefits: 0.00378,
        },
        2026: {
            fixed: 51.27,
            kWDemandPowerSupplyPeak: 8.62,
            kWDemandDistributionFacilities: 18.21,
            variable: {
                summerOnPeak: 0.10005,
                summerMidPeak: 0.07571,
                summerOffPeak: 0.05408,
                winterMidPeak: 0.08305,
                winterOffPeak: 0.05408,
            },
            powerFactorAdjustment: 0.18720,
            publicBenefits: 0.00405,
        },
        2027: {
            fixed: 53.32,
            kWDemandPowerSupplyPeak: 8.96,
            kWDemandDistributionFacilities: 18.94,
            variable: {
                summerOnPeak: 0.10405,
                summerMidPeak: 0.07874,
                summerOffPeak: 0.05624,
                winterMidPeak: 0.08637,
                winterOffPeak: 0.05624,
            },
            powerFactorAdjustment: 0.19469,
            publicBenefits: 0.00419,
        },
        2028: {
            fixed: 55.45,
            kWDemandPowerSupplyPeak: 9.32,
            kWDemandDistributionFacilities: 19.70,
            variable: {
                summerOnPeak: 0.10821,
                summerMidPeak: 0.08189,
                summerOffPeak: 0.05849,
                winterMidPeak: 0.08982,
                winterOffPeak: 0.05849,
            },
            powerFactorAdjustment: 0.20248,
            publicBenefits: 0.00433,
        },
        2029: {
            fixed: 57.67,
            kWDemandPowerSupplyPeak: 9.69,
            kWDemandDistributionFacilities: 20.49,
            variable: {
                summerOnPeak: 0.11254,
                summerMidPeak: 0.08517,
                summerOffPeak: 0.06083,
                winterMidPeak: 0.09341,
                winterOffPeak: 0.06083,
            },
            powerFactorAdjustment: 0.21058,
            publicBenefits: 0.00448,
        },
    },
    industrialTOU8: {
        2024: {
            fixed: 346.00,
            kWDemandPowerSupplyPeak: {
                summerOnPeak: 16.91,
                summerMidPeak: 5.71,
            },
            kWDemandDistributionFacilities: 8.31,
            variable: {
                summerOnPeak: 0.12675,
                summerMidPeak: 0.10299,
                summerOffPeak: 0.07184,
                winterMidPeak: 0.10538,
                winterOffPeak: 0.07509,
            },
            powerFactorAdjustment: 0.18000,
        },
        2025: {
            fixed: 76.97,
            kWDemandPowerSupplyPeak: 8.31,
            kWDemandDistributionFacilities: 15.06,
            variable: {
                summerOnPeak: 0.09630,
                summerMidPeak: 0.07319,
                summerOffPeak: 0.05200,
                winterMidPeak: 0.07986,
                winterOffPeak: 0.05200,
            },
            powerFactorAdjustment: 0.18000,
            publicBenefits: 0.00378,
        },
        2026: {
            fixed: 80.05,
            kWDemandPowerSupplyPeak: 8.64,
            kWDemandDistributionFacilities: 15.66,
            variable: {
                summerOnPeak: 0.10015,
                summerMidPeak: 0.07611,
                summerOffPeak: 0.05408,
                winterMidPeak: 0.08305,
                winterOffPeak: 0.05408,
            },
            powerFactorAdjustment: 0.18720,
            publicBenefits: 0.00405,
        },
        2027: {
            fixed: 83.25,
            kWDemandPowerSupplyPeak: 8.99,
            kWDemandDistributionFacilities: 16.29,
            variable: {
                summerOnPeak: 0.10416,
                summerMidPeak: 0.07915,
                summerOffPeak: 0.05624,
                winterMidPeak: 0.08637,
                winterOffPeak: 0.05624,
            },
            powerFactorAdjustment: 0.19469,
            publicBenefits: 0.00419,
        },
        2028: {
            fixed: 86.58,
            kWDemandPowerSupplyPeak: 9.35,
            kWDemandDistributionFacilities: 16.94,
            variable: {
                summerOnPeak: 0.10833,
                summerMidPeak: 0.08232,
                summerOffPeak: 0.05849,
                winterMidPeak: 0.08982,
                winterOffPeak: 0.05849,
            },
            powerFactorAdjustment: 0.20248,
            publicBenefits: 0.00433,
        },
        2029: {
            fixed: 90.04,
            kWDemandPowerSupplyPeak: 9.72,
            kWDemandDistributionFacilities: 17.62,
            variable: {
                summerOnPeak: 0.11266,
                summerMidPeak: 0.08561,
                summerOffPeak: 0.06083,
                winterMidPeak: 0.09341,
                winterOffPeak: 0.06083,
            },
            powerFactorAdjustment: 0.21058,
            publicBenefits: 0.00448,
        },
    },
    outdoorAreaLightingAL2: {
        2024: {
            fixed: 7.00,
            variable: 0.08224,
        },
        2025: {
            fixed: 10.26,
            variable: 0.11678,
            publicBenefits: 0.00378,
        },
        2026: {
            fixed: 10.67,
            variable: 0.12145,
            publicBenefits: 0.00405,
        },
        2027: {
            fixed: 11.10,
            variable: 0.12631,
            publicBenefits: 0.00419,
        },
        2028: {
            fixed: 11.54,
            variable: 0.13136,
            publicBenefits: 0.00433,
        },
        2029: {
            fixed: 12.01,
            variable: 0.13661,
            publicBenefits: 0.00448,
        },
    },
    streetLightingLS3: {
        2024: {
            fixed: 7.00,
            variable: 0.08224,
        },
        2025: {
            fixed: 10.26,
            variable: 0.11678,
            publicBenefits: 0.00378,
        },
        2026: {
            fixed: 10.67,
            variable: 0.12145,
            publicBenefits: 0.00405,
        },
        2027: {
            fixed: 11.10,
            variable: 0.12631,
            publicBenefits: 0.00419,
        },
        2028: {
            fixed: 11.54,
            variable: 0.13136,
            publicBenefits: 0.00433,
        },
        2029: {
            fixed: 12.01,
            variable: 0.13661,
            publicBenefits: 0.00448,
        },
    },
    trafficControlTC1: {
        2024: {
            fixed: {
                singlePhase: 9.49,
                threePhase: 3.16,
            },
            variable: 0.11407,
        },
        2025: {
            fixed: {
                singlePhase: 13.91,
                threePhase: 4.64,
            },
            variable: 0.16345,
            publicBenefits: 0.00378,
        },
        2026: {
            fixed: {
                singlePhase: 14.47,
                threePhase: 4.82,
            },
            variable: 0.17598,
            publicBenefits: 0.00405,
        },
        2027: {
            fixed: {
                singlePhase: 15.05,
                threePhase: 5.02,
            },
            variable: 0.18994,
            publicBenefits: 0.00419,
        },
        2028: {
            fixed: {
                singlePhase: 15.65,
                threePhase: 5.22,
            },
            variable: 0.20852,
            publicBenefits: 0.00433,
        },
        2029: {
            fixed: {
                singlePhase: 16.28,
                threePhase: 5.43,
            },
            variable: 0.23192,
            publicBenefits: 0.00448,
        },
    },
    commercialEVChargingRate: {
        2025: {
            fixed: 76.97,
            kWDemandMonth: 15.06,
            kWhEnergyOnPeak4to9PM: 0.19710,
            kWhEnergyOffPeak: 0.06570,
            powerFactorAdjustment: 0.18000,
            publicBenefits: 0.00378,
        },
        2026: {
            fixed: 80.05,
            kWDemandMonth: 15.66,
            kWhEnergyOnPeak4to9PM: 0.20498,
            kWhEnergyOffPeak: 0.06833,
            powerFactorAdjustment: 0.18720,
            publicBenefits: 0.00405,
        },
        2027: {
            fixed: 83.25,
            kWDemandMonth: 16.29,
            kWhEnergyOnPeak4to9PM: 0.21318,
            kWhEnergyOffPeak: 0.07106,
            powerFactorAdjustment: 0.19469,
            publicBenefits: 0.00419,
        },
        2028: {
            fixed: 86.58,
            kWDemandMonth: 16.94,
            kWhEnergyOnPeak4to9PM: 0.22171,
            kWhEnergyOffPeak: 0.07390,
            powerFactorAdjustment: 0.20248,
            publicBenefits: 0.00433,
        },
        2029: {
            fixed: 90.04,
            kWDemandMonth: 17.62,
            kWhEnergyOnPeak4to9PM: 0.23058,
            kWhEnergyOffPeak: 0.07686,
            powerFactorAdjustment: 0.21058,
            publicBenefits: 0.00448,
        },
    },
    pumpingAndAgriculture: {
        2024: {
            fixed: 63.25,
            kWDemandPowerSupplyPeak: 10.85,
            kWDemandDistributionFacilities: 3.85,
            variable: {
                summerOnPeak: 0.13064,
                summerMidPeak: 0.10929,
                summerOffPeak: 0.05226,
                winterMidPeak: 0.12255,
                winterOffPeak: 0.05226,
            },
            powerFactorAdjustment: 0.18000,
        },
        2025: {
            fixed: 19.14,
            kWDemandPowerSupplyPeak: { 
                january: 6.00, 
                july: 12.00,
            },
            kWDemandDistributionFacilities: {
                january: 8.00,
                july: 10.00,
            },
            variable: {
                summerOnPeak: 0.10361,
                summerMidPeak: 0.07874,
                summerOffPeak: 0.05595,
                winterMidPeak: 0.08592,
                winterOffPeak: 0.05595,
            },
            powerFactorAdjustment: 0.18000,
            publicBenefits: 0.00378,
        },
        2026: {
            fixed: 20.86,
            kWDemandPowerSupplyPeak: 12.98,
            kWDemandDistributionFacilities: 21.55,
            variable: {
                summerOnPeak: 0.09444,
                summerMidPeak: 0.07178,
                summerOffPeak: 0.05100,
                winterMidPeak: 0.07832,
                winterOffPeak: 0.05100,
            },
            powerFactorAdjustment: 0.18720,
            publicBenefits: 0.00405,
        },
        2027: {
            fixed: 21.69,
            kWDemandPowerSupplyPeak: 13.50,
            kWDemandDistributionFacilities: 22.41,
            variable: {
                summerOnPeak: 0.09822,
                summerMidPeak: 0.07465,
                summerOffPeak: 0.05304,
                winterMidPeak: 0.08145,
                winterOffPeak: 0.05304,
            },
            powerFactorAdjustment: 0.19469,
            publicBenefits: 0.00419,
        },
        2028: {
            fixed: 22.56,
            kWDemandPowerSupplyPeak: 14.04,
            kWDemandDistributionFacilities: 23.31,
            variable: {
                summerOnPeak: 0.10215,
                summerMidPeak: 0.07764,
                summerOffPeak: 0.05516,
                winterMidPeak: 0.08471,
                winterOffPeak: 0.05516,
            },
            powerFactorAdjustment: 0.20248,
            publicBenefits: 0.00433,
        },
        2029: {
            fixed: 23.46,
            kWDemandPowerSupplyPeak: 14.60,
            kWDemandDistributionFacilities: 24.24,
            variable: {
                summerOnPeak: 0.10624,
                summerMidPeak: 0.08075,
                summerOffPeak: 0.05737,
                winterMidPeak: 0.08810,
                winterOffPeak: 0.05737,
            },
            powerFactorAdjustment: 0.21058,
            publicBenefits: 0.00448,
        }
    },
    kWhStateTax: 0.0003,
}

/* NOTE: global variables from files like rates.js and structural-script.js are accessible because of html <script> tag */

// static containers
const waterBillCalculatorForm = document.getElementById('water-bill-calculator-form');
const electricBillCalculatorForm = document.getElementById('electric-bill-calculator-form');
const calculationResultDiv = document.getElementById('calculation-result-div');
const tableDataRow = document.getElementById('table-data-row');
const chargeBreakdownContainer = document.getElementById('charge-breakdown-container');

// conditional general containers
const seasonsHeader = document.getElementById('seasons-header');
const tableDataRow2 = document.getElementById('table-data-row-2');

// conditional sewer containers
const generalNonResidentialContainer = document.getElementById('general-non-residential-container');
const insideCommercialContainer = document.getElementById('inside-commercial-container');
const mobileHomeParksPerSpaceContainer = document.getElementById('mobile-home-parks-per-space-container');
const motelsAndHotelsPerUnitContainer = document.getElementById('motels-and-hotels-per-unit-container');
const motelsAndHotelsPerLivingUnitContainer = document.getElementById('motels-and-hotels-per-living-unit-container');
const retailFoodAndEssentialServicesContainer = document.getElementById('retail-food-and-essential-services-container');

// conditional water containers
const sewerRatesContainer = document.getElementById('sewer-rates-container');
const residentialWaterRatesContainer = document.getElementById('residential-water-rates-container');
const commercialWaterRatesContainer = document.getElementById('commercial-water-rates-container');
const reclaimedWaterRatesContainer = document.getElementById('reclaimed-water-rates-container');
const electricRatesContainer = document.getElementById('electric-rates-container');
const privateFireIncludedCommercialContainer = document.getElementById('private-fire-included-commercial-container');
const privateFireIncludedContainer = document.getElementById('private-fire-included-container');

// conditional electric containers
const electricUniversalInputsContainer = document.getElementById('electric-universal-inputs-container');
const electricResidentialInputsContainer = document.getElementById('electric-residential-inputs-container');
const electricTOUGS3TOU8InputsContainer = document.getElementById('electric-TOUGS3-TOU8-inputs-container');
const electricTOUGS3TOU8PAInputsContainer = document.getElementById('electric-TOUGS3-TOU8-PA-inputs-container');
const electricTOUGS3TOU8PACOMMEVInputContainer = document.getElementById('electric-TOUGS3-TOU8-PA-COMMEV-input-container');
const electricTOUGS3TOU8PAGS2COMMEVInputContainer = document.getElementById('electric-TOUGS3-TOU8-PA-GS2-COMMEV-input-container');
const electricTOUGS3TOU8PAGS2InputContainer = document.getElementById('electric-TOUGS3-TOU8-PA-GS2-input-container');
const electricGS1TC1InputContainer = document.getElementById('electric-GS1-TC1-input-container');
const electricCOMMEVInputContainer = document.getElementById('electric-COMMEV-input-container');

// general elements
const customerClassMenu = document.getElementById('calculator-type-menu');

// residential water elements
const waterPrivateFireIncludedMenu = document.getElementById('water-private-fire-included-menu');

// commercial water elements
const commercialPrivateFireIncludedMenu = document.getElementById('commercial-water-private-fire-included-menu');

let customerClass = '';
let utilityType = '';

const costs = [];

let operations = {};

const resetDataDisplayElements = () => {
    seasonsHeader.style.display = 'none';
    while (tableDataRow.firstChild) {
        tableDataRow.removeChild(tableDataRow.firstChild);
    }
    
    while (tableDataRow2.firstChild) {
        tableDataRow2.removeChild(tableDataRow2.firstChild);
    }

    while(chargeBreakdownContainer.firstChild) {
        chargeBreakdownContainer.removeChild(chargeBreakdownContainer.firstChild);
    }
};

const getArraySum = (array) => array.reduce((acc, curr) => acc += curr);

const getArrayProduct = (array) => array.reduce((acc, curr) => acc *= curr);

const roundToNthDecimalPlace = (number, decimalPlaces) => {
    const factor = Math.pow(10, decimalPlaces);
    return (Math.round(number * factor) / factor).toFixed(2);
};

const formatCost = (cost) => {
    const isNumber = !isNaN(cost);

    if (isNumber && cost > 0) return `$${roundToNthDecimalPlace(cost, 2)}`;
    else return '--';
}

const operate = ({operandValues = [], operandNames = [], operator, category}) => {
    let total = 0;
    const categoryExists = operations[category];

    if (operator === '*') total = getArrayProduct(operandValues);
    else if (operator === '+') total = getArraySum(operandValues);
    else return 'No operator found.';

    const roundedValues = operandValues.map((operandValue) => roundToNthDecimalPlace(operandValue, 2));
    const operationAndTotal = `${operandNames.join(` ${operator} `)} = Total Charges\n${roundedValues.join(` ${operator} `)} = ${formatCost(total)}`;
    if (!categoryExists && category) operations[category] = [operationAndTotal];
    else if (!categoryExists && !category) operations['General Charges'] = [operationAndTotal];
    else operations[category].push(operationAndTotal);

    return total;
};

const displayOperations = () => {
    const operationEntries = Object.entries(operations);

    operationEntries.forEach(([category, operations]) => {
        const chargeContainer = document.createElement('div');
        const chargeHeader = document.createElement('h3');
        chargeHeader.innerText = category;

        chargeContainer.appendChild(chargeHeader);
        operations.forEach(operation => {
            const operationParagraph = document.createElement('p');
            operationParagraph.innerText = operation;
            chargeContainer.appendChild(operationParagraph);
        });

        chargeBreakdownContainer.appendChild(chargeContainer);
    });
}

const resetCosts = () => costs.length = 0;

const resetOperations = () => operations = {};

const makeInputsRequired = (boolean) => {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        const isVisible = input.offsetParent !== null;

        if (boolean && isVisible) input.setAttribute('required', true);
        else input.removeAttribute('required');
    });
};

const showContainer = (containers, showBooleans) => {
    makeInputsRequired(false);
    resetDataDisplayElements();
    containers.forEach((container, index) => {
        showBooleans[index] ?
        container.setAttribute('style', 'display: "";') : 
        container.setAttribute('style', 'display: none;');
    });
    makeInputsRequired(true);
};

const createTable = (seasonal) => {
    const years = [2024, 2025, 2026, 2027, 2028, 2029];

    if (seasonal) {
        showContainer([seasonsHeader, tableDataRow2], [true, true]);
        
        const { seasons, seasonalCosts } = costs[0];
        
        const winterHeader = document.createElement('th');
        winterHeader.id = 'winter-row';
        winterHeader.scope = 'row';
        winterHeader.innerText = `${seasons[0]}\n(Four Months)`;
        tableDataRow.appendChild(winterHeader);
        seasonalCosts[0].forEach((cost, index) => {
            const tableDataElement = document.createElement('td');
            tableDataElement.id = `${years[index]}-${seasons[0].toLowerCase()}-cost`;
            tableDataElement.innerText = `Month Estimation: ${formatCost(cost)}\n\nWinter Estimation: ${formatCost(cost * 4)}`;

            tableDataRow.appendChild(tableDataElement);
        });

        const summerHeader = document.createElement('th');
        summerHeader.id ='summer-row';
        summerHeader.scope = 'row';
        summerHeader.innerText = `${seasons[1]}\n(Eight Months)`;
        tableDataRow2.appendChild(summerHeader);
        seasonalCosts[1].forEach((cost, index) => {
            const tableDataElement = document.createElement('td');
            tableDataElement.id = `${years[index]}-${seasons[1].toLowerCase()}-cost`;
            tableDataElement.innerText = `Month Estimation: ${formatCost(cost)}\n\nSummer Estimation: ${formatCost(cost * 8)}`;

            tableDataRow2.appendChild(tableDataElement);
        });
    } else {
        showContainer([seasonsHeader, tableDataRow2], [false, false]);

        costs.forEach((cost, index) => {
            const tableDataElement = document.createElement('td');
            tableDataElement.id = `${years[index]}-cost`;
            tableDataElement.textContent = formatCost(cost);
    
            tableDataRow.appendChild(tableDataElement);
        });
    }

    displayOperations();
    resetOperations();
}

const containerCoordinator = (sewerCustomerGroup) => {
    if (!utilityType || !customerClass) {
        showContainer([waterBillCalculatorForm, electricBillCalculatorForm], [false, false]);
        return;
    }
    
    if (utilityType === 'Sewer') {
        showContainer([waterBillCalculatorForm, sewerRatesContainer, residentialWaterRatesContainer, commercialWaterRatesContainer, reclaimedWaterRatesContainer, electricBillCalculatorForm], [true, true, false, false, false, false]);
        if (sewerCustomerGroup === 'insideStandardWastewater') showContainer([generalNonResidentialContainer, mobileHomeParksPerSpaceContainer, insideCommercialContainer, motelsAndHotelsPerUnitContainer, motelsAndHotelsPerLivingUnitContainer, retailFoodAndEssentialServicesContainer], [false, false, false, false, false, false]);
        else if (sewerCustomerGroup === 'insideStandardWastewaterMobileHome') showContainer([generalNonResidentialContainer, mobileHomeParksPerSpaceContainer, insideCommercialContainer, motelsAndHotelsPerUnitContainer, motelsAndHotelsPerLivingUnitContainer, retailFoodAndEssentialServicesContainer], [true, true, false, false, false, false])
        else if (sewerCustomerGroup === 'motelsAndHotelsPerUnit') showContainer([generalNonResidentialContainer, motelsAndHotelsPerUnitContainer, insideCommercialContainer, mobileHomeParksPerSpaceContainer, motelsAndHotelsPerLivingUnitContainer, retailFoodAndEssentialServicesContainer], [true, true, false, false, false, false])
        else if (sewerCustomerGroup === 'motelsAndHotelsPerLivingUnit') showContainer([generalNonResidentialContainer, motelsAndHotelsPerLivingUnitContainer, insideCommercialContainer, mobileHomeParksPerSpaceContainer, motelsAndHotelsPerUnitContainer, retailFoodAndEssentialServicesContainer], [true, true, false, false, false, false])
        else if (sewerCustomerGroup === 'retailFoodAndEssentialServices') showContainer([generalNonResidentialContainer,retailFoodAndEssentialServicesContainer, insideCommercialContainer, mobileHomeParksPerSpaceContainer, motelsAndHotelsPerUnitContainer, motelsAndHotelsPerLivingUnitContainer], [true, true, false, false, false, false])
        else if (sewerCustomerGroup === 'insideCommercial') showContainer([generalNonResidentialContainer, insideCommercialContainer, mobileHomeParksPerSpaceContainer, motelsAndHotelsPerUnitContainer, motelsAndHotelsPerLivingUnitContainer, retailFoodAndEssentialServicesContainer], [true, true, false, false, false, false])
    } else if (['Water', 'Sewer'].includes(utilityType)) {
        if (customerClass === 'Residential Water') showContainer([waterBillCalculatorForm, residentialWaterRatesContainer, commercialWaterRatesContainer, sewerRatesContainer, reclaimedWaterRatesContainer, electricBillCalculatorForm], [true, true, false, false, false, false]);
        else if (customerClass === 'Commercial Water') showContainer([waterBillCalculatorForm, commercialWaterRatesContainer, residentialWaterRatesContainer, sewerRatesContainer, reclaimedWaterRatesContainer, electricBillCalculatorForm], [true, true, false, false, false, false]);
        else if (customerClass === 'Reclaimed Water') showContainer([waterBillCalculatorForm, reclaimedWaterRatesContainer, sewerRatesContainer, residentialWaterRatesContainer, commercialWaterRatesContainer, electricBillCalculatorForm], [true, true, false, false, false, false]);
    } else if (utilityType === 'Electric') {
        showContainer([electricBillCalculatorForm, electricUniversalInputsContainer, waterBillCalculatorForm], [true, true, false], true);
        if (customerClass === 'residential') showContainer([electricResidentialInputsContainer, electricTOUGS3TOU8InputsContainer, electricTOUGS3TOU8PACOMMEVInputContainer, electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricGS1TC1InputContainer, electricCOMMEVInputContainer, electricTOUGS3TOU8PAInputsContainer], [true, false, false, false, false, false, false, false]);
        else if (customerClass === 'smallCommercialGS1') showContainer([electricGS1TC1InputContainer, electricResidentialInputsContainer, electricTOUGS3TOU8InputsContainer, electricTOUGS3TOU8PACOMMEVInputContainer, electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricCOMMEVInputContainer, electricTOUGS3TOU8PAInputsContainer], [true, false, false, false, false, false, false, false]);
        else if (customerClass === 'mediumCommercialGS2') showContainer([electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricGS1TC1InputContainer, electricResidentialInputsContainer, electricTOUGS3TOU8InputsContainer, electricTOUGS3TOU8PACOMMEVInputContainer, electricCOMMEVInputContainer, electricTOUGS3TOU8PAInputsContainer], [true, true, false, false, false, false, false, false]);
        else if (['largeCommercialTOUGS3', 'industrialTOU8'].includes(customerClass)) showContainer([electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricTOUGS3TOU8InputsContainer, electricTOUGS3TOU8PACOMMEVInputContainer, electricTOUGS3TOU8PAInputsContainer, electricGS1TC1InputContainer, electricResidentialInputsContainer, electricCOMMEVInputContainer], [true, true, true, true, true, false, false, false]);
        else if (customerClass === 'pumpingAndAgriculture') showContainer([electricTOUGS3TOU8PAInputsContainer, electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricTOUGS3TOU8PACOMMEVInputContainer, electricTOUGS3TOU8InputsContainer, electricGS1TC1InputContainer, electricResidentialInputsContainer, electricCOMMEVInputContainer], [true, true, true, true, false, false, false, false]);
        else if (customerClass === 'trafficControlTC1') showContainer([electricGS1TC1InputContainer, electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricResidentialInputsContainer, electricTOUGS3TOU8InputsContainer, electricTOUGS3TOU8PACOMMEVInputContainer, electricCOMMEVInputContainer, electricTOUGS3TOU8PAInputsContainer], [true, false, false, false, false, false, false, false]);
        else if (customerClass === 'commercialEVChargingRate') showContainer([electricTOUGS3TOU8PACOMMEVInputContainer, electricCOMMEVInputContainer, electricGS1TC1InputContainer, electricTOUGS3TOU8PAGS2COMMEVInputContainer, electricTOUGS3TOU8PAGS2InputContainer, electricResidentialInputsContainer, electricTOUGS3TOU8InputsContainer, electricTOUGS3TOU8PAInputsContainer], [true, true, false, false, false, false, false, false]);
    } else return 'No utility type found.';
}

// Call the function to set the inputs as required
makeInputsRequired();

// general event listeners
customerClassMenu.addEventListener('change', (event) => {
    const selectMenuEvent = event?.currentTarget;
    const selectedMenuOption = selectMenuEvent.options[selectMenuEvent.selectedIndex];

    const customerClassValue = selectMenuEvent.value;
    const utilityTypeValue = selectedMenuOption.getAttribute('data-group');
    
    customerClass = customerClassValue;
    utilityType = utilityTypeValue;
    containerCoordinator();

    if (utilityType === 'Sewer') findSewerCustomerClassGroup();
});
waterBillCalculatorForm.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
        if (utilityType === 'Sewer') getSewerRate(event);
        else if (customerClass === 'Residential Water') getWaterRate(event);
        else if (customerClass === 'Commercial Water') getWaterRate(event);
        else if (customerClass === 'Reclaimed Water') getReclaimedWaterRate(event);
        createTable();
    } catch (error) {
        console.error(error);
    }
});

// electric event listeners
electricBillCalculatorForm.addEventListener('submit', (event) => { 
    event.preventDefault();
    try {
        getElectricRate(event);
    } catch (error) {
        console.error(error);
    }
});

// water event listeners
waterPrivateFireIncludedMenu.addEventListener('change', (event) => {
    const privateFireIncluded = event?.target.value === 'true';
    if (privateFireIncluded) showContainer([privateFireIncludedContainer], [true]);
    else showContainer([privateFireIncludedContainer], [false]);
});

// commercial water menu event listeners
commercialPrivateFireIncludedMenu.addEventListener('change', (event) => {
    const privateFireIncluded = event?.target.value === 'true';
    if (privateFireIncluded) showContainer([privateFireIncludedCommercialContainer], [true]);
    else showContainer([privateFireIncludedCommercialContainer], [false]);
});

/**
 * NOTE: global variables from files like rates.js and structural-script.js are accessible because of html <script> tag
 * 
 * ET gets divided by 12 so that it comes out to feet since it's in inches
 * The denominator of the budgets is often 100 so that it comes out to hundred cubic feet
 * commercialBillingCycleDays: three past years' billing cycle days for a given month
 * commercialUsedHCFBillingUnits: three past years' usage for a given month
 */

let data = {
    waterIsResidential: false,
    sewer: {
        isResidential: false,
        meterSize: { decimal: 0, fraction: '' },
        usedHCFBillingUnits: 0,
        numberOfSpaces: 0,
        numberOfUnits: 0,
        numberOfLivingUnits: 0,
        isMeterSizeGreaterThan1Inch: false,
    },
    water: {
        householdMembers: 0,
        isResidential: false,
        billingCycleDays: 0,
        evapotranspirationRateInches: 0,
        usedHCFBillingUnits: 0,
        irrigatedAreaSquareFeet: 0,
        meterSize: { decimal: 0, fraction: '' },
        privateFireIncluded: false,
        privateFireMeterSize: '',
    },
    commercial: {
        usedHCFBillingUnits: 0,
        billingCycleDays: 0,
        commercialBillingCycleDays: { 1: 0, 2: 0, 3: 0 },
        commercialUsedHCFBillingUnits: { 1: 0, 2: 0, 3: 0 },
        meterSize: { decimal: 0, fraction: '' },
        privateFireIncluded: false,
        privateFireMeterSize: '',
    },
    reclaimed: {
        usedHCFBillingUnits: 0,
        meterSize: { decimal: 0, fraction: '' },
        irrigatedAreaSquareFeet: 0,
        evapotranspirationRateInches: 0,
    }
};

const setWaterFormData = (event) => {
    const formData = new FormData(event.currentTarget);
    const formDataEntries = Array.from(formData.entries());
    
    for (const [key, value] of formDataEntries) {
        const singleNestedStringObjectRegex = /^(\w+)\[(\w+)\]$/;
        const singleNestedMatches = key.match(singleNestedStringObjectRegex);

        const doubleNestedStringObjectRegex = /^(\w+)\[(\w+)\]\[(\w+)\]$/;
        const doubleNestedMatches = key.match(doubleNestedStringObjectRegex);
        
        if (singleNestedMatches) {
            const key1 = singleNestedMatches[1]; // e.g. sewer[name] => sewer
            const key2 = singleNestedMatches[2]; // e.g. sewer[name] => name

            if (key2 === 'meterSize') {
                const [decimal, fraction] = value.replace(/[\[\]]/g, '').split(', ');
                data[key1].meterSize = { decimal: +decimal, fraction: fraction };
            } else {
                if (!data[key1]) data[key1] = {};

                
                if (value === 'true') data[key1][key2] = true;
                else if (value === 'false') data[key1][key2] = false;
                else if (!isNaN(value) && value.trim() !== '') data[key1][key2] = Number(value);
                else data[key1][key2] = value;
            }
        } else {
            const key1 = doubleNestedMatches[1]; // e.g. commercial[billingCycleDays][1] => commercial
            const key2 = doubleNestedMatches[2]; // e.g. commercial[billingCycleDays][1] => billingCycleDays
            const key3 = doubleNestedMatches[3]; // e.g. commercial[billingCycleDays][1] => 1
        
            if (!data[key1]) data[key1] = {};
            if (!data[key1][key2]) data[key1][key2] = {};

            if (value === 'true') data[key1][key2][key3] = true;
            else if (value === 'false') data[key1][key2][key3] = false;
            else if (!isNaN(value) && value.trim() !== '') data[key1][key2][key3] = Number(value);
            else data[key1][key2][key3] = value;
        }
    }
}

const findSewerCustomerClassGroup = () => {
    const group1 = [['Residential', 'City Park Restroom', 'Mobile Home Parks (Per Space)'], 'insideStandardWastewater'];
    const group2 = [['Motels (Per Unit)', 'Hotels (Per Unit)'], 'motelsAndHotelsPerUnit'];
    const group3 = [['Motels (Per Living Unit)', 'Hotels (Per Living Unit)'], 'motelsAndHotelsPerLivingUnit'];
    const group4 = [['Restaurants', 'Supermarkets', 'Mortuaries', 'Bakeries'], 'retailFoodAndEssentialServices'];
    const group5 = [['Laundries'], 'laundries'];
    const group6 = [['Inside Commercial'], 'insideCommercial'];

    if (group1[0].includes(customerClass)) {
        const customerClassGroup = group1[1];
        const isMobileHome = customerClass === 'Mobile Home Parks (Per Space)';
        const sewerCustomerClassGroup = `${customerClassGroup}${isMobileHome ? 'MobileHome' : ''}`;

        containerCoordinator(sewerCustomerClassGroup);
        return sewerCustomerClassGroup;
    } else if (group2[0].includes(customerClass)) { 
        containerCoordinator(group2[1]);
        return group2[1];
    } else if (group3[0].includes(customerClass)) { 
        containerCoordinator(group3[1]);
        return group3[1];
    } else if (group4[0].includes(customerClass)) { 
        containerCoordinator(group4[1]);
        return group4[1] + (data.sewer.isMeterSizeGreaterThan1Inch ? 'GreaterThanOneInchMeter' : 'LessThanOrEqualToOneInchMeter');
    } else if (group5[0].includes(customerClass)) {
        containerCoordinator(group5[1]);
        return group5[1];
    } else if (group6[0].includes(customerClass)) { 
        containerCoordinator(group6[1]);
        return group6[1];
    } else return 'No customer class found.';
}

const getSewerRate = (event) => {
    resetCosts();
    setWaterFormData(event);
    const hcfBillingUnitsBudget = 8;
    
    const customerClassGroup = findSewerCustomerClassGroup();

    for (let year = 2024; year <= 2029; year++) {
        if (year === 2024) {
            if (customerClassGroup === 'insideCommercial') {
                costs.push(operate({
                    operandValues: [sewerRates.fixed[2024][customerClassGroup][data.sewer.meterSize.fraction]],
                    operandNames: ['Fixed Charge at Meter Size'],
                    operator: '+',
                    category: `${year} Estimated Charges`,
                }));
            } else if (customerClassGroup === 'insideStandardWastewaterMobileHome') {
                costs.push(operate({
                    operandValues: [sewerRates.fixed[2024][customerClassGroup], data.sewer.numberOfSpaces],
                    operandNames: ['Base Fixed Charge', 'Number of Spaces'],
                    operator: '*',
                    category: `${year} Estimated Charges`,
                }));
            } else if (customerClassGroup === 'motelsAndHotelsPerUnit') {
                costs.push(operate({
                    operandValues: [sewerRates.fixed[2024][customerClassGroup], data.sewer.numberOfUnits],
                    operandNames: ['Base Fixed Charge', 'Number of Units'],
                    operator: '*',
                    category: `${year} Estimated Charges`,
                 }));
            } else if (customerClassGroup === 'motelsAndHotelsPerLivingUnit') {
                costs.push(operate({
                    operandValues: [sewerRates.fixed[2024][customerClassGroup], data.sewer.numberOfLivingUnits],
                    operandNames: ['Base Fixed Charge', 'Number of Living Units'],
                    operator: '*',
                    category: `${year} Estimated Charges`,
                 }));
            } else {
                costs.push(operate({
                    operandValues: [sewerRates.fixed[2024][customerClassGroup]],
                    operandNames: ['Fixed Charge'],
                    operator: '+',
                    category: `${year} Estimated Charges`,
                }));
            };
        } else {
            const fixedCharge = sewerRates.fixed[year];
            const mustPayVariableCharge = customerClass !== 'Residential' && data.sewer.usedHCFBillingUnits > hcfBillingUnitsBudget;
            const variableCharge = mustPayVariableCharge ? sewerRates.variable[year] * (data.sewer.usedHCFBillingUnits - hcfBillingUnitsBudget) : 0;

            costs.push(operate({
                operandValues: [fixedCharge, variableCharge],
                operandNames: ['Fixed Charge', 'Variable Charge'],
                operator: '+',
                category: `${year} Estimated Charges`,
            }));
        }
    }
}

const findCommercialWaterBudget = (billingHistoryYears) => {
    // no billing history years means that the customer is on their first year, Tier 1 rates are expected in that case
    if (billingHistoryYears === 1) {
        return getArraySum(Object.values(data.commercial.commercialUsedHCFBillingUnits).filter(value => value));
    } else if (billingHistoryYears >= 2) {
        const commercialUsedHCFBillingUnitsSum = getArraySum(Object.values(data.commercial.commercialUsedHCFBillingUnits).filter(value => value));
        const commercialBillingCycleDaysSum = getArraySum(Object.values(data.commercial.commercialBillingCycleDays).filter(value => value));
        const commercialAverageDailyHCFBillingUnitsUsage = commercialUsedHCFBillingUnitsSum / commercialBillingCycleDaysSum;
        return commercialAverageDailyHCFBillingUnitsUsage * data.commercial.billingCycleDays;
    } else return 'No billing history found.';
}

const findVariableWaterCharge = (year) => {
    const billingUnitGallons = 748; // 1 billing unit = 1 hundred cubic feet (HCF) = 748 gallons
    const gallonsPerPersonPerDayAllotment = 47;
    const outdoorEfficiencyFactorConstant = 0.8; // also called plant factor
    
    const indoorHCFBillingUnitsBudget = (data.water.householdMembers * gallonsPerPersonPerDayAllotment * data.water.billingCycleDays) / billingUnitGallons;
    const outdoorHCFBillingUnitsBudget = (data.water.irrigatedAreaSquareFeet * (data.water.evapotranspirationRateInches / 12) * outdoorEfficiencyFactorConstant) / 100;
    const budget = indoorHCFBillingUnitsBudget + outdoorHCFBillingUnitsBudget;

    const isResidential = data.waterIsResidential;
    
    const usedHCFBillingUnits = isResidential ? data.water.usedHCFBillingUnits : data.commercial.usedHCFBillingUnits;
    
    const tierBilling = { tier1: 0, tier2: 0, tier3: 0, tier4: 0, tier5: 0 };
    
    // console.log(indoorHCFBillingUnitsBudget, outdoorHCFBillingUnitsBudget);

    if (isResidential) {
        for (let accruedBillingUnits = 0; accruedBillingUnits < usedHCFBillingUnits; accruedBillingUnits += 0.001) {
            if (year === 2024) {
                if (accruedBillingUnits <= indoorHCFBillingUnitsBudget) tierBilling['tier1'] += 0.001;
                else if (indoorHCFBillingUnitsBudget < accruedBillingUnits && accruedBillingUnits <= budget) tierBilling['tier2'] += 0.001;
                else if (budget < accruedBillingUnits && accruedBillingUnits <= (budget * 1.50)) tierBilling['tier3'] += 0.001;
                else if ((budget * 1.50) < accruedBillingUnits && accruedBillingUnits <= (budget * 2.00)) tierBilling['tier4'] += 0.001;
                else if ((budget * 2.00) < accruedBillingUnits) tierBilling['tier5'] += 0.001;
                else return 'No tier found.';
            } else {
                if (accruedBillingUnits <= indoorHCFBillingUnitsBudget) tierBilling['tier1'] += 0.001;
                else if (indoorHCFBillingUnitsBudget < accruedBillingUnits && accruedBillingUnits <= budget) tierBilling['tier2'] += 0.001;
                else if (budget < accruedBillingUnits && accruedBillingUnits <= (budget * 1.50)) tierBilling['tier3'] += 0.001;
                else if ((budget * 1.50) < accruedBillingUnits) tierBilling['tier4'] += 0.001;
                else return 'No tier found.';
            }
        }
    } else {
        const billingHistoryYears = Object.values(data.commercial.commercialUsedHCFBillingUnits).filter(value => value).length;
        const commercialBudget = findCommercialWaterBudget(billingHistoryYears);
        for (let accruedBillingUnits = 0; accruedBillingUnits < usedHCFBillingUnits; accruedBillingUnits += 0.001) {
            if (year === 2024) {
                if (!billingHistoryYears || accruedBillingUnits <= commercialBudget) tierBilling['tier1'] += 0.001;
                else if (commercialBudget < accruedBillingUnits && accruedBillingUnits <= (commercialBudget * 1.50)) tierBilling['tier2'] += 0.001;
                else if ((commercialBudget * 1.50) < accruedBillingUnits && accruedBillingUnits <= (commercialBudget * 2.00)) tierBilling['tier3'] += 0.001;
                else if ((commercialBudget * 2.00) < accruedBillingUnits) tierBilling['tier4'] += 0.001;
                else return 'No tier found.';
            } else if (year !== 2024) {                
                if (!billingHistoryYears || accruedBillingUnits <= commercialBudget) tierBilling['tier1'] += 0.001;
                else if (commercialBudget < accruedBillingUnits && accruedBillingUnits <= (commercialBudget * 1.50)) tierBilling['tier2'] += 0.001;
                else if ((commercialBudget * 1.50) < accruedBillingUnits) tierBilling['tier3'] += 0.001;
                else return 'No tier found.';
            } else {
                return 'No tier condition met.';
            }
        }
    }
    
    const residentialOrCommercial = isResidential ? 'residential' : 'commercial';
    
    const tierBillingEntries = Object.entries(tierBilling);

    // console.log(tierBillingEntries);

    const tierBillingCosts = tierBillingEntries.map(([tier, units]) => {
        const tierRate = waterRates.variable[residentialOrCommercial][year][tier];
        if (tierRate) {
            return operate({
                operandValues: [tierRate, units],
                operandNames: [`${tier.toUpperCase()} Rate Estimated Charges`],
                operator: '*',
                category: `${year} Estimated Charges`,
            });
        } else return 0;
    });

    return getArraySum(tierBillingCosts);
}

// current and proposed rate formulas are identical
const getWaterRate = (event) => {
    resetCosts();
    setWaterFormData(event);
    
    if (customerClass === 'Residential Water') data.waterIsResidential = true;
    else if (customerClass === 'Commercial Water') data.waterIsResidential = false;

    const meterFraction = data.waterIsResidential ? data.water.meterSize.fraction : data.commercial.meterSize.fraction;
    const privateFireIncluded = data.waterIsResidential ? data.water.privateFireIncluded : data.commercial.privateFireIncluded;
    const privateFireFraction = data.waterIsResidential ? data.water.privateFireMeterSize : data.commercial.privateFireMeterSize;

    for (let year = 2024; year <= 2029; year++) {
        const fixedCharge = waterRates.fixed.domestic[year][meterFraction];
        const privateFire = privateFireIncluded ? waterRates.fixed.privateFire[year][privateFireFraction] : 0;
        const variableCharge = findVariableWaterCharge(year);

        costs.push(operate({
            operandValues: [fixedCharge, privateFire, variableCharge],
            operandNames: ['Fixed Charge', 'Private Fire', 'Variable Charge'],
            operator: '+',
            category: `${year} Estimated Charges`,
        }))
    }
}

const findReclaimedVariableCharge = (year) => {
    const outdoorEfficiencyFactorConstant = 0.8; // also called plant factor
    const reclaimedWaterBudget = data.reclaimed.irrigatedAreaSquareFeet * (data.reclaimed.evapotranspirationRateInches / 12) * outdoorEfficiencyFactorConstant;

    const usedHCFBillingUnits = data.reclaimed.usedHCFBillingUnits;

    const tierBilling = { tier1: 0, tier2: 0, tier3: 0, tier4: 0 };

    for (let accruedBillingUnits = 0; accruedBillingUnits < usedHCFBillingUnits; accruedBillingUnits++) {
        if (year === 2024) {
            if (accruedBillingUnits <= reclaimedWaterBudget) tierBilling['tier1'] += 1;
            else if (reclaimedWaterBudget < accruedBillingUnits && accruedBillingUnits <= (reclaimedWaterBudget * 1.50)) tierBilling['tier2'] += 1;
            else if ((reclaimedWaterBudget * 1.50) < accruedBillingUnits && accruedBillingUnits <= (reclaimedWaterBudget * 2.00)) tierBilling['tier3'] += 1;
            else if ((reclaimedWaterBudget * 2.00) < accruedBillingUnits) tierBilling['tier4'] += 1;
            else return 'No tier found.';
        } else {
            tierBilling[accruedBillingUnits <= reclaimedWaterBudget ? 'tier1' : 'tier2'] += 1;
        }
    }

    const tierBillingEntries = Object.entries(tierBilling);
    const tierBillingCosts = tierBillingEntries.map(([tier, units]) => {
        const tierRate = reclaimedWaterRates.variable[year][tier];
        if (tierRate) return tierRate * units;
        else return 0;
    });

    return getArraySum(tierBillingCosts);
}

// current and proposed rate formulas are identical
const getReclaimedWaterRate = (event) => {
    resetCosts();
    setWaterFormData(event);
    for (let year = 2024; year <= 2029; year++) {
        const fixedCharge = reclaimedWaterRates.fixed[year][data.reclaimed.meterSize.fraction];
        const variableCharge = findReclaimedVariableCharge(year);

        costs.push(operate({
            operandValues: [fixedCharge, variableCharge],
            operandNames: ['Fixed Charge', 'Variable Charge'],
            operator: '+',
            category: `${year} Estimated Charges`,
        }));
    }
}