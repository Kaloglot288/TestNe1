import dotenv from 'dotenv';

dotenv.config();

function required(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} not provided in .env`);
  }

  return value;
}

export function loadConfig() {
  const minAge = Number(required('MIN_AGE'));

  if (!Number.isFinite(minAge) || minAge < 0) {
    throw new Error('MIN_AGE must be a non-negative number');
  }

  return {
    inputFile: required('INPUT_FILE'),
    outputFile: required('OUTPUT_FILE'),
    minAge,
    cityFilter: required('CITY_FILTER'),
  };
}
