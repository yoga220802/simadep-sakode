"use client";

import { useMemo } from "react";
import { Autocomplete, AutocompleteItem, Button } from "@heroui/react";
import { X } from "lucide-react";
import type { Key } from "react";

interface ProjectYearFilterProps {
	startYear: number | null;
	endYear: number | null;
	onYearChange: (start: number | null, end: number | null) => void;
}

// Generate an array of objects for Autocomplete items
const generateYears = (): { key: string; label: string }[] => {
	const currentYear = new Date().getFullYear();
	const years = [];
	for (let i = currentYear + 1; i >= 2010; i--) {
		years.push({ key: i.toString(), label: i.toString() });
	}
	return years;
};

export default function ProjectYearFilter({
	startYear,
	endYear,
	onYearChange,
}: ProjectYearFilterProps) {
	const years = useMemo(() => generateYears(), []);

	const handleStartYearChange = (key: Key | null) => {
		const newStartYear = key ? Number(key) : null;
		// Jika tahun awal baru lebih besar dari tahun akhir, samakan tahun akhir
		if (endYear && newStartYear && newStartYear > endYear) {
			onYearChange(newStartYear, newStartYear);
		} else {
			onYearChange(newStartYear, endYear);
		}
	};

	const handleEndYearChange = (key: Key | null) => {
		const newEndYear = key ? Number(key) : null;
		// Jika tahun akhir baru lebih kecil dari tahun awal, samakan tahun awal
		if (startYear && newEndYear && newEndYear < startYear) {
			onYearChange(newEndYear, newEndYear);
		} else {
			onYearChange(startYear, newEndYear);
		}
	};

	const handleClear = () => {
		onYearChange(null, null);
	};

	return (
		<div className='flex items-center gap-2'>
			<Autocomplete
				aria-label='Tahun Awal'
				placeholder='Awal'
				items={years}
				selectedKey={startYear ? startYear.toString() : null}
				onSelectionChange={handleStartYearChange}
				size='sm'
				className='w-32'>
				{(item) => <AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>}
			</Autocomplete>
			<span className='text-gray-400'>-</span>
			<Autocomplete
				aria-label='Tahun Akhir'
				placeholder='Akhir'
				items={years}
				selectedKey={endYear ? endYear.toString() : null}
				onSelectionChange={handleEndYearChange}
				size='sm'
				className='w-32'>
				{(item) => <AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>}
			</Autocomplete>
			{(startYear || endYear) && (
				<Button
					isIconOnly
					variant='light'
					size='sm'
					onPress={handleClear}
					aria-label='Hapus filter tahun'>
					<X size={16} />
				</Button>
			)}
		</div>
	);
}
