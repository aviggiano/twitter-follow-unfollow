import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Cursor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  me?: string;
  @Column({ nullable: true })
  toFollow?: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
