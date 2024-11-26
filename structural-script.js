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
  const years = [2025, 2026, 2027, 2028, 2029];

  if (seasonal) {
    showContainer([seasonsHeader, tableDataRow2], [true, true]);

    const { seasons, seasonalCosts } = costs[0];

    const winterHeader = document.createElement('th');
    winterHeader.id = 'winter-row';
    winterHeader.scope = 'row';
    winterHeader.innerText = `Winter\n(Eight Months)`;
    tableDataRow.appendChild(winterHeader);
    seasonalCosts[0].forEach((cost, index) => {
      const tableDataElement = document.createElement('td');
      tableDataElement.id = `${years[index]}-${seasons[0].toLowerCase()}-cost`;
      tableDataElement.innerText = `Month Estimation: ${formatCost(cost)}\n\nWinter Estimation: ${formatCost(cost * 8)}`;

      tableDataRow.appendChild(tableDataElement);
    });

    const summerHeader = document.createElement('th');
    summerHeader.id ='summer-row';
    summerHeader.scope = 'row';
    summerHeader.innerText = `Summer\n(Four Months)`;
    tableDataRow2.appendChild(summerHeader);
    seasonalCosts[1].forEach((cost, index) => {
      const tableDataElement = document.createElement('td');
      tableDataElement.id = `${years[index]}-${seasons[1].toLowerCase()}-cost`;
      tableDataElement.innerText = `Month Estimation: ${formatCost(cost)}\n\nSummer Estimation: ${formatCost(cost * 4)}`;

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