import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function parsePositiveMinutes(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue) && numericValue > 0) return numericValue;
  }
  throw badRequest('Activity minutes must be a positive number.');
}

function normalizeType(value: unknown) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw badRequest('Activity type is required.');
  }
  return value.trim().toLowerCase();
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw badRequest('Activity payload is required.');

  const payload = input as Record<string, unknown>;
  const userId = String(payload.userId ?? '').trim();
  const teamId = String(payload.teamId ?? '').trim();
  const type = normalizeType(payload.type);
  const minutes = parsePositiveMinutes(payload.minutes);

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw badRequest('A valid userId is required.');
  }
  if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
    throw badRequest('A valid teamId is required.');
  }

  const user = await User.findById(userId);
  if (!user) throw badRequest('User not found for the activity.');

  const team = await Team.findById(teamId);
  if (!team) throw badRequest('Team not found for the activity.');

  return Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: Math.max(1, Math.round(minutes)),
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw badRequest('Team payload is required.');

  const payload = input as Record<string, unknown>;
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const mascot = typeof payload.mascot === 'string' ? payload.mascot.trim() : '';

  if (!name) throw badRequest('Team name is required.');
  if (!mascot) throw badRequest('Team mascot is required.');

  const membersInput = Array.isArray(payload.members) ? payload.members : [];
  const members = membersInput
    .map((member) => String(member).trim())
    .filter(Boolean)
    .filter((member) => mongoose.Types.ObjectId.isValid(member));

  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const rows = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamId: '$_id', teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return rows.map((row, index) => ({
    teamName: row.teamName,
    totalPoints: row.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = String(userEmail ?? '').trim().toLowerCase();
  if (!normalizedEmail) throw badRequest('A user email is required.');

  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) throw badRequest('User not found.');

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentTypes = recentActivities
    .map((activity) => String(activity.type ?? '').trim().toLowerCase())
    .filter(Boolean);
  const goal = String(user.fitnessGoal ?? '').trim().toLowerCase() || recentTypes[0] || 'endurance';
  const workouts = await Workout.find().lean();

  const ranked = workouts
    .map((workout) => {
      const focus = String(workout.focus ?? '').trim().toLowerCase();
      const score = Number(
        (focus === goal ? 3 : 0) +
          (recentTypes.includes(focus) ? 2 : 0) +
          (recentTypes.includes(String(workout.title ?? '').trim().toLowerCase()) ? 1 : 0),
      );
      const reason = `Matches your ${goal || 'recent'} activity pattern${recentTypes.length ? ` and recent ${recentTypes[0]} activity` : ''}.`;
      return { ...workout, score, reason };
    })
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));

  return ranked.map(({ _id, score, reason, ...workout }) => ({
    ...workout,
    id: String(_id),
    reason,
  }));
}

export { User };
