"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { CricketAddButton } from "@/components/cricket-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCricket } from "@/lib/cricket-context";
import { Team, Player } from "@/lib/cricket-types";

interface TeamSetupProps {
  onNext: () => void;
}

export default function TeamSetup({ onNext }: TeamSetupProps) {
  const { setTeam1, setTeam2, setMatchConfig } = useCricket();
  const [step, setStep] = useState<"team1" | "team2" | "config" | "confirm">("team1");
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [totalOvers, setTotalOvers] = useState("10");
  const [ballsPerOver, setBallsPerOver] = useState("6");
  const [tempTeam1, setTempTeam1] = useState<Team | null>(null);
  const [tempTeam2, setTempTeam2] = useState<Team | null>(null);
  const [editingFromConfirm, setEditingFromConfirm] = useState<"team1" | "team2" | "config" | null>(null);

  const addPlayer = () => {
    if (playerName.trim()) {
      const newPlayer: Player = {
        id: `player-${Date.now()}`,
        name: playerName,
        role: "all-rounder",
        gender: "male",
        battingStyle: "right-hand",
        bowlingStyle: "none",
      };
      setPlayers([...players, newPlayer]);
      setPlayerName("");
    }
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter((p) => p.id !== id));
  };

  const handleTeamComplete = () => {
    if (!teamName.trim() || players.length < 2) {
      alert("Please enter team name and at least 2 players");
      return;
    }

    const team: Team = {
      id: `team-${Date.now()}`,
      name: teamName,
      players,
    };

    if (step === "team1") {
      if (editingFromConfirm === "team1") {
        setTempTeam1(team);
        setTeam1(team);
        setEditingFromConfirm(null);
        setStep("confirm");
        return;
      }

      setTempTeam1(team);
      setTeam1(team);
      setStep("team2");
      setTeamName("");
      setPlayers([]);
    } else {
      if (editingFromConfirm === "team2") {
        setTempTeam2(team);
        setTeam2(team);
        setEditingFromConfirm(null);
        setStep("confirm");
        return;
      }

      setTempTeam2(team);
      setTeam2(team);
      setStep("config");
    }
  };

  const handleConfigComplete = () => {
    const overs = parseInt(totalOvers);
    const balls = parseInt(ballsPerOver);

    if (overs < 1 || balls < 1) {
      alert("Please enter valid overs and balls per over");
      return;
    }

    if (editingFromConfirm === "config") {
      setEditingFromConfirm(null);
      setStep("confirm");
      return;
    }

    setStep("confirm");
  };

  const handleEditSection = (section: "team1" | "team2" | "config") => {
    setEditingFromConfirm(section);
    if (section === "team1" && tempTeam1) {
      setTeamName(tempTeam1.name);
      setPlayers(tempTeam1.players);
      setPlayerName("");
      setStep("team1");
      return;
    }

    if (section === "team2" && tempTeam2) {
      setTeamName(tempTeam2.name);
      setPlayers(tempTeam2.players);
      setPlayerName("");
      setStep("team2");
      return;
    }

    setStep("config");
  };

  const handleConfirmStartMatch = () => {
    const overs = parseInt(totalOvers);
    const balls = parseInt(ballsPerOver);
    if (!tempTeam1 || !tempTeam2 || overs < 1 || balls < 1) {
      alert("Please complete and verify all setup details.");
      return;
    }

    setMatchConfig({
      totalOvers: overs,
      ballsPerOver: balls,
    });
    onNext();
  };

  return (
    <div className="cricket-page min-h-screen">
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {(step === "team1" || step === "team2") && (
          <Card className="cricket-broadcast-card border-0 shadow-none gap-0 py-0">
            <CardHeader>
              <CardTitle className="cricket-display text-[var(--cricket-cream)]">
                {step === "team1" ? "Team 1 Setup" : "Team 2 Setup"}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enter team name and select {step === "team1" ? "" : ""} players
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="cricket-form-label">
                  Team Name
                </label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., Mumbai Indians"
                  className="cricket-form-input"
                />
              </div>

              <div>
                <label className="cricket-form-label">
                  Add Players
                </label>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Player name"
                    className="cricket-form-input"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") addPlayer();
                    }}
                  />
                  <CricketAddButton
                    type="button"
                    variant="player"
                    size="inline"
                    onClick={addPlayer}
                  >
                    Add Player
                  </CricketAddButton>
                </div>

                <div className="space-y-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex justify-between items-center bg-slate-700 p-3 rounded"
                    >
                      <span className="text-white">{player.name}</span>
                      <Button
                        onClick={() => removePlayer(player.id)}
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <p className="text-slate-400 text-sm mt-3">
                  Players added: {players.length}
                </p>
              </div>

              <Button
                onClick={handleTeamComplete}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editingFromConfirm
                  ? "Save Team Changes"
                  : step === "team1"
                    ? "Continue"
                    : "Continue"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "config" && (
          <Card className="cricket-broadcast-card border-0 shadow-none gap-0 py-0">
            <CardHeader>
              <CardTitle className="cricket-display text-[var(--cricket-cream)]">Match Configuration</CardTitle>
              <CardDescription className="text-slate-400">
                Set match parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="cricket-form-label">
                  Total Overs
                </label>
                <Input
                  type="number"
                  value={totalOvers}
                  onChange={(e) => setTotalOvers(e.target.value)}
                  min="1"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="cricket-form-label">
                  Balls Per Over
                </label>
                <Input
                  type="number"
                  value={ballsPerOver}
                  onChange={(e) => setBallsPerOver(e.target.value)}
                  min="1"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="bg-slate-700 p-4 rounded space-y-2">
                <p className="text-white text-sm font-medium">
                  Team 1: {tempTeam1?.name}
                </p>
                <p className="text-white text-sm font-medium">
                  Team 2: {tempTeam2?.name}
                </p>
              </div>

              <Button
                onClick={handleConfigComplete}
                className="w-full cricket-btn-play cricket-btn-play--quick"
              >
                {editingFromConfirm === "config"
                  ? "Save Match Config"
                  : "Continue"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "confirm" && (
          <Card className="cricket-broadcast-card border-0 shadow-none gap-0 py-0">
            <CardHeader>
              <CardTitle className="cricket-display text-[var(--cricket-cream)]">Confirm Match Setup</CardTitle>
              <CardDescription className="text-slate-400">
                Review all setup data before starting the match.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-700 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-semibold">Team 1</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-transparent"
                      onClick={() => handleEditSection("team1")}
                      aria-label="Edit Team 1"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-slate-200">{tempTeam1?.name}</p>
                  <p className="text-slate-400 text-sm">
                    Players: {tempTeam1?.players.length || 0}
                  </p>
                  <div className="pt-1 space-y-1">
                    {tempTeam1?.players.map((player) => (
                      <div
                        key={player.id}
                        className="text-slate-300 text-sm bg-slate-800/60 rounded px-2 py-1"
                      >
                        <span>{player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-700 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-semibold">Team 2</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-transparent"
                      onClick={() => handleEditSection("team2")}
                      aria-label="Edit Team 2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-slate-200">{tempTeam2?.name}</p>
                  <p className="text-slate-400 text-sm">
                    Players: {tempTeam2?.players.length || 0}
                  </p>
                  <div className="pt-1 space-y-1">
                    {tempTeam2?.players.map((player) => (
                      <div
                        key={player.id}
                        className="text-slate-300 text-sm bg-slate-800/60 rounded px-2 py-1"
                      >
                        <span>{player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-700 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-white font-semibold">Match Config</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-transparent"
                    onClick={() => handleEditSection("config")}
                    aria-label="Edit Match Config"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-slate-200">Overs: {totalOvers}</p>
                <p className="text-slate-200">Balls per over: {ballsPerOver}</p>
              </div>

              <Button
                onClick={handleConfirmStartMatch}
                className="w-full cricket-btn-play cricket-btn-play--quick"
              >
                Start Match
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
