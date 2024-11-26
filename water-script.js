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

  for (let year = 2025; year <= 2029; year++) {
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

  for (let year = 2025; year <= 2029; year++) {
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
  for (let year = 2025; year <= 2029; year++) {
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