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
export class Post {
    @PrimaryGeneratedColumn()
    id!: number;


    @Column()
    title!: string;

    @ManyToOne(() => User)
    author!: User;


    @Column()
    createdAt: Date = new Date();
}