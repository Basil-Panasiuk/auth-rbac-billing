import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { runSeeders } from 'typeorm-extension';
import { dataSourceOptions } from './data-source';

const dataSource = new DataSource(dataSourceOptions);

dataSource
  .initialize()
  .then(async () => {
    await runSeeders(dataSource);
    await dataSource.destroy();
  })
  .catch((error) => console.error(error));
