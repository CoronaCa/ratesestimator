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

const seasonTypes = {
    summer: 'summer',
    winter: 'winter',
}
  
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
  
    return season === seasonTypes.summer ? kWhSummer4To9PMPeakUsageEstimate : kWhWinter4To9PMPeakUsageEstimate;
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
    let kWhBaseline = (season.toLowerCase() === seasonTypes.summer) ? residentialRates.kWhSummerBaseline : residentialRates.kWhWinterBaseline;
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
      totalPublicBenefitsCharges += publicBenefitsCost;
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
        kWTotalCharges += (season === seasonTypes.summer ? kWPowerSupplyPeakDemandCost : 0);
        kWTotalCharges +=  kWDistributionFacilitiesDemandCost;
        kWhTotalCharges += customerClassAndYear.variable[season] * electricFormData.kWhTotalMonthlyEnergyUsage;
      } else {
        kWTotalCharges += demandCosts;
        kWhTotalCharges += customerClassAndYear.variable * electricFormData.kWhTotalMonthlyEnergyUsage;
        totalPublicBenefitsCharges += customerClassAndYear.publicBenefits * electricFormData.kWhTotalMonthlyEnergyUsage
      }
    } else if (['largeCommercialTOUGS3', 'industrialTOU8', 'pumpingAndAgriculture'].includes(customerClass)) {
      const isSummer = season === seasonTypes.summer;
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
    const seasons = [seasonTypes.winter, seasonTypes.summer];
  
    const winterCosts = [];
    const summerCosts = [];
  
    let seasonIndex = 0;
    while (seasonIndex < seasons.length) {
      const season = seasons[seasonIndex].toLowerCase();
  
      for (let year = 2025; year <= 2029; year++) {
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