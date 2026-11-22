import { describe, expect, it } from 'vitest';

import type { Playlist } from '../types';
import { type AutoplayInput, resolveAutoplay } from './player-autoplay';

const playlist: Playlist = [
  { surahId: '2', link: 'https://example.test/2.mp3' },
  { surahId: '3', link: 'https://example.test/3.mp3' },
];

const makeInput = (overrides: Partial<AutoplayInput> = {}): AutoplayInput => ({
  reciterId: 'reciter-1',
  selectedSurah: null,
  playlist,
  playlistLoading: false,
  alreadyAttempted: false,
  ...overrides,
});

describe('resolveAutoplay', () => {
  it('does not play without a reciter', () => {
    expect(resolveAutoplay(makeInput({ reciterId: null }))).toEqual({
      shouldPlay: false,
      surahId: null,
    });
  });

  it('does not play once an autoplay attempt was already made', () => {
    expect(
      resolveAutoplay(makeInput({ alreadyAttempted: true })).shouldPlay,
    ).toBe(false);
  });

  it('does not play while the playlist is loading', () => {
    expect(
      resolveAutoplay(makeInput({ playlistLoading: true })).shouldPlay,
    ).toBe(false);
  });

  it('does not play with an empty playlist', () => {
    expect(resolveAutoplay(makeInput({ playlist: [] })).shouldPlay).toBe(false);
  });

  it('plays the selected surah when it is in the playlist', () => {
    expect(resolveAutoplay(makeInput({ selectedSurah: 3 }))).toEqual({
      shouldPlay: true,
      surahId: 3,
    });
  });

  it('falls back to the first playlist item when the selected surah is absent', () => {
    expect(resolveAutoplay(makeInput({ selectedSurah: 99 }))).toEqual({
      shouldPlay: true,
      surahId: 2,
    });
  });

  it('plays the first playlist item when no surah is selected', () => {
    expect(resolveAutoplay(makeInput())).toEqual({
      shouldPlay: true,
      surahId: 2,
    });
  });

  it('prefers an explicit deep-link surahId over the default surah 1', () => {
    const playlistWithSurahOne: Playlist = [
      { surahId: '1', link: 'https://example.test/1.mp3' },
      ...playlist,
    ];

    expect(
      resolveAutoplay(
        makeInput({
          playlist: playlistWithSurahOne,
          selectedSurah: 1,
          explicitSurahId: 3,
        }),
      ),
    ).toEqual({ shouldPlay: true, surahId: 3 });
  });

  it('falls back to the first playlist item when an explicit surahId is absent', () => {
    expect(resolveAutoplay(makeInput({ explicitSurahId: 99 }))).toEqual({
      shouldPlay: true,
      surahId: 2,
    });
  });
});
