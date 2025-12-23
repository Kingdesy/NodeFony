import { entreprise } from './entreprise';
import { Profile } from './Profile';
import { Post } from './Post';
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


@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;


    @Column()
    name!: string;


    @Column()
    createdAt: Date = new Date();

    @OneToMany(() => Post, (post) => post.author)
    posts!: Post[];


    @OneToOne(() => Profile)
    @JoinColumn()
    profile!: Profile;


    @OneToMany(() => entreprise, (entreprise) => entreprise.prop)
    entreprises!: entreprise[];

}