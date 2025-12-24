import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    OneToMany, 
    ManyToMany, 
    OneToOne, 
    JoinTable, 
    JoinColumn 
} from 'typeorm';
import { User } from './User';


@Entity()
export class Entreprise {
    @PrimaryGeneratedColumn()
    id!: number;


    @Column()
    name!: string;

    @ManyToMany(() => User)
    @JoinTable()
    pdg!: User[];


    @Column()
    createdAt: Date = new Date();
}