"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Player } from "@/lib/cricket-types";
import { formatPlayerRole } from "@/lib/player-options";
import { cn } from "@/lib/utils";

interface PlayerAssignComboboxProps {
  players: Player[];
  getOptionLabel: (player: Player) => string;
  isOptionDisabled: (player: Player) => boolean;
  onSelectPlayer: (playerId: string) => void;
  placeholder?: string;
}

export default function PlayerAssignCombobox({
  players,
  getOptionLabel,
  isOptionDisabled,
  onSelectPlayer,
  placeholder = "Search player to add",
}: PlayerAssignComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label={placeholder}
          className={cn(
            "player-assign-combobox-trigger cricket-form-input",
            "flex h-10 w-full items-center justify-between gap-2 text-left font-normal"
          )}
        >
          <span className="truncate text-[oklch(0.5_0.03_255)]">
            {placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="player-assign-combobox-content cricket-select-content w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command className="player-assign-combobox-command bg-transparent">
          <CommandInput placeholder="Type to search players…" />
          <CommandList>
            <CommandEmpty className="text-[oklch(0.55_0.03_255)]">
              No players found.
            </CommandEmpty>
            <CommandGroup>
              {players.map((player) => {
                const disabled = isOptionDisabled(player);
                return (
                  <CommandItem
                    key={player.id}
                    value={`${player.name} ${formatPlayerRole(player.role)}`}
                    disabled={disabled}
                    onSelect={() => {
                      if (disabled) return;
                      onSelectPlayer(player.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "cursor-pointer text-[var(--cricket-cream)]",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="min-w-0 truncate">
                      {getOptionLabel(player)}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
