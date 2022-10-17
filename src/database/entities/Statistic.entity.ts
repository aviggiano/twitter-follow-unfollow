import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Statistic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  total: number;
  @Column()
  toFollow: number;
  @Column()
  followed: number;
  @Column()
  unfollowed: number;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
