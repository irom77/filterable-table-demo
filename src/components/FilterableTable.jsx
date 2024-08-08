import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const data = [
  { id: 1, name: 'John Doe', age: 30, city: 'New York', occupation: 'Engineer' },
  { id: 2, name: 'Jane Smith', age: 25, city: 'San Francisco', occupation: 'Designer' },
  { id: 3, name: 'Bob Johnson', age: 35, city: 'Chicago', occupation: 'Manager' },
  { id: 4, name: 'Alice Brown', age: 28, city: 'Los Angeles', occupation: 'Developer' },
];

const callClaudeAPI = async (input) => {
  const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;;
  if (!API_KEY) {
    throw new Error("Anthropic API key is not set");
  }

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Given the following columns in a table: name, age, city, occupation.
                    The user has entered the following search query: "${input}"
                    Please respond with only a single word that best represents the column 
                    the user is likely trying to filter by. If no column seems relevant, respond with "none".`
        }
      ]
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      }
    }
  );

  return response.data.content[0].text.trim().toLowerCase();
};

const FilterableTable = () => {
  const [userInput, setUserInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await callClaudeAPI(userInput);
      setSearchTerm(result === 'none' ? '' : result);
    } catch (error) {
      console.error("Error calling Claude API:", error);
      setError('Failed to process your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = useMemo(() => {
    if (searchTerm) {
      return Object.keys(data[0]).filter(col => col.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return Object.keys(data[0]);
  }, [searchTerm]);

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="Enter your search query"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Search'}
        </Button>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {searchTerm && (
        <p className="mb-2">Showing columns including: <strong>{searchTerm}</strong></p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              {columns.map((col) => (
                <TableCell key={`${row.id}-${col}`}>{row[col]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FilterableTable;