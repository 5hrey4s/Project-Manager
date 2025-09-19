"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { FileText, Folder, Search } from "lucide-react"
import { searchItems } from "../services/api"

// Define the structure of our search results
interface SearchResult {
  id: number;
  title: string;
  type: 'project' | 'task';
  project_id?: number;
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])

  // This effect listens for Cmd+K or Ctrl+K to open the palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // This effect fetches search results as the user types
  useEffect(() => {
    if (search.length > 1) {
      const fetchResults = async () => {
        try {
          const res = await searchItems(search);
          setResults(res.data);
        } catch (error) {
          console.error("Search failed:", error);
          setResults([]);
        }
      };
      fetchResults();
    } else {
      setResults([]);
    }
  }, [search]);

  // This function handles navigation when an item is selected
  const handleSelect = (result: SearchResult) => {
    if (result.type === 'project') {
      router.push(`/project/${result.id}`);
    } else if (result.type === 'task') {
      // Navigate to the project and pass the task ID as a query param
      router.push(`/project/${result.project_id}?taskId=${result.id}`);
    }
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Search for projects or tasks..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {results.length > 0 && (
          <CommandGroup heading="Results">
            {results.map((result) => (
              <CommandItem
                key={`${result.type}-${result.id}`}
                value={result.title}
                onSelect={() => handleSelect(result)}
                className="cursor-pointer"
              >
                {result.type === 'project' ? (
                  <Folder className="mr-2 h-4 w-4" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                <span>{result.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}