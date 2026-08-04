import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tb_credit_cards")
export class CreditCardEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_credit_cards" })
  idCreditCard!: string;

  @Column({ name: "idtb_users" })
  idUsers!: string;

  @Column({ length: 80 })
  name!: string;

  @Column({ name: "credit_limit", type: "numeric", precision: 12, scale: 2 })
  creditLimit!: string;

  @Column({ name: "due_day", type: "int" })
  dueDay!: number;

  @Column({ name: "closing_day", type: "int" })
  closingDay!: number;

  @Column({ default: true })
  status!: boolean;

  @Column({ name: "inactivated_at", type: "timestamp", nullable: true })
  inactivatedAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;
}
