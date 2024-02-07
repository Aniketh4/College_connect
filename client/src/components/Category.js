import React, { useState } from 'react';
import { FormControl, MenuItem, Select, Typography } from "@mui/material";
import HorizontalStack from "./util/HorizontalStack";

const CategoryDropdown = ({ onSelectCategory }) => {
  const categories = ['All', 'Lost and Found', 'Questions and Answers','Accomodation'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleCategoryChange = (event) => {
    const newCategory = String(event.target.value);
    setSelectedCategory(newCategory);
    onSelectCategory(newCategory);
  };

  return (
    <HorizontalStack spacing={1} alignItems="center">
      <Typography
        color="text.secondary"
        variant="subtitle2"
        sx={{
          display: {
            xs: "none",
            sm: "block",
          },
          marginRight: 1,
        }}
      >
        Select Category:
      </Typography>
      <Select
        size="small"
        value={selectedCategory}
        sx={{ minWidth: 150 }}
        onChange={handleCategoryChange}
      >
        {categories.map((category, i) => (
          <MenuItem key={i} value={category}>
            {category}
          </MenuItem>
        ))}
      </Select>
    </HorizontalStack>
  );
};

export default CategoryDropdown;
