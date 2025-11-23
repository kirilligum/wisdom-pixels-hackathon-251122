import { db } from '../client';
import { BrandsRepository } from './brands.repository';
import { PersonasRepository } from './personas.repository';
import { EnvironmentsRepository } from './environments.repository';
import { InfluencersRepository } from './influencers.repository';
import { CardsRepository } from './cards.repository';
import { WorkflowRunsRepository } from './workflow-runs.repository';

// Create repository instances
export const brandsRepo = new BrandsRepository(db);
export const personasRepo = new PersonasRepository(db);
export const environmentsRepo = new EnvironmentsRepository(db);
export const influencersRepo = new InfluencersRepository(db);
export const cardsRepo = new CardsRepository(db);
export const workflowRunsRepo = new WorkflowRunsRepository(db);

// Export repository classes
export {
  BrandsRepository,
  PersonasRepository,
  EnvironmentsRepository,
  InfluencersRepository,
  CardsRepository,
  WorkflowRunsRepository,
};
