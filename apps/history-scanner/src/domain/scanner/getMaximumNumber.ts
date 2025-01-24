export const getMaximumNumber = (arrayOfNumbers: number[]) => {
	return arrayOfNumbers.reduce(
		(max, currentNumber) => (max >= currentNumber ? max : currentNumber),
		-Infinity
	);
};
