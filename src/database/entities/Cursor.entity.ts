import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  IsNull,
  Not,
  DataSource,
} from "typeorm";

@Entity()
export class Cursor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  running?: boolean;
  @Column({ nullable: true })
  me?: string;
  @Column({ nullable: true })
  toFollow?: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}

export async function getCursor(database: DataSource): Promise<Cursor> {
  let cursor = await database.manager.findOne(Cursor, {
    where: {
      id: Not(IsNull()),
    },
  });
  if (!cursor) {
    await database.manager.save(Cursor, {});
    cursor = (await database.manager.findOne(Cursor, {})) as Cursor;
  }
  return cursor;
}
