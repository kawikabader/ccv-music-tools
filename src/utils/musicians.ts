import { v4 as uuidv4 } from 'uuid';
import type { Musician } from '../types';
import musicianData from '../data/musicians.json';

let musicians = [...musicianData.musicians];

export const addMusician = (newMusician: { name: string; phone: string }): Musician => {
  const musician: Musician = {
    id: uuidv4(),
    name: newMusician.name,
    instrument: '',
    phone: newMusician.phone,
  };

  musicians.push(musician);
  return musician;
};

export const getMusicians = (): Musician[] => {
  return musicians;
};

export const updateMusicians = (updatedMusicians: Musician[]): void => {
  musicians = updatedMusicians;
};
