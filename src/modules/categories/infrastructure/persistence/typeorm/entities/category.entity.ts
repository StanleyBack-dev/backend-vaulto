import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tb_categories")
export class CategoryEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_categories" })
  idCategory!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ length: 80 })
  name!: string;

  @Column({ default: true })
  status!: boolean;

  @Column({ name: "inactivated_at", type: "timestamp", nullable: true })
  inactivatedAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;
}
