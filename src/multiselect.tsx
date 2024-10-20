import React, { useState } from 'react'
import { FormControl, FormLabel } from '@chakra-ui/react'
import Select, { type MultiValue } from 'react-select'
import { chainOptions, type ChainOptionType } from './utils'

interface MultiSelectChainOptionsProps {
  onChange: (selectedChains: string[]) => void
}

const MultiSelectChainOptions: React.FC<MultiSelectChainOptionsProps> = ({ onChange }) => {
  const [selectedOptions, setSelectedOptions] = useState<MultiValue<ChainOptionType>>([])

  const handleChange = (newValue: MultiValue<ChainOptionType>): void => {
    setSelectedOptions(newValue)
    onChange(newValue.map(option => option.value))
  }

  const customStyles = {
    option: (provided: any, state: { isSelected: any }) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#805AD5' : 'white',
      color: state.isSelected ? 'white' : 'black',
      '&:hover': { backgroundColor: '#D6BCFA' }
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#E9D8FD'
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: '#553C9A'
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: '#553C9A',
      '&:hover': {
        backgroundColor: '#B794F4',
        color: 'white'
      }
    })
  }

  return (
    <FormControl isRequired>
      <FormLabel>Chains</FormLabel>
      <Select
        isMulti
        options={chainOptions}
        value={selectedOptions}
        onChange={handleChange}
        styles={customStyles}
        getOptionLabel={(option: ChainOptionType) => `${option.label} (${option.symbol})`}
        getOptionValue={(option: ChainOptionType) => option.value}
      />
    </FormControl>
  )
}

export default MultiSelectChainOptions
