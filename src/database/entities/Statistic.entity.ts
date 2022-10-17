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

  @Column({ nullable: true })
  total?: number;
  @Column({ nullable: true })
  toFollow?: number;
  @Column({ nullable: true })
  followed?: number;
  @Column({ nullable: true })
  unfollowed?: number;
  @Column({ nullable: true })
  running?: boolean;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
